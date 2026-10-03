// Byte-preserving reader for the JX INI/enum files.
// It keeps section/key/value spans in a Latin-1 byte view and never writes a
// source file. Replacements are returned as in-memory Buffers for staging.
const assert = require('assert/strict');

function asBuffer(value) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  throw new TypeError('INI source must be a Buffer or Uint8Array');
}

function lines(source) {
  const result = [];
  let start = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== 0x0a) continue;
    const contentEnd = index > start && source[index - 1] === 0x0d ? index - 1 : index;
    result.push({ start, contentStart: start, contentEnd, end: index + 1, newline: contentEnd < index ? 'CRLF' : 'LF' });
    start = index + 1;
  }
  if (start < source.length || result.length === 0) result.push({ start, contentStart: start, contentEnd: source.length, end: source.length, newline: '' });
  return result;
}

function trimStart(source, start, end) {
  while (start < end && (source[start] === 0x20 || source[start] === 0x09)) start += 1;
  return start;
}

function trimEnd(source, start, end) {
  while (end > start && (source[end - 1] === 0x20 || source[end - 1] === 0x09)) end -= 1;
  return end;
}

function parse(input) {
  const source = asBuffer(input);
  const records = lines(source);
  const sections = [];
  const byName = new Map();
  let current = null;
  for (const record of records) {
    let start = trimStart(source, record.contentStart, record.contentEnd);
    if (start >= record.contentEnd) continue;
    if (source[start] === 0x3b || source[start] === 0x23 || (source[start] === 0x2d && source[start + 1] === 0x2d)) continue;
    if (source[start] === 0x5b) {
      let close = start + 1;
      while (close < record.contentEnd && source[close] !== 0x5d) close += 1;
      if (close >= record.contentEnd) continue;
      const nameStart = start + 1;
      const nameEnd = trimEnd(source, nameStart, close);
      const name = source.subarray(nameStart, nameEnd).toString('latin1');
      current = { name, line: records.indexOf(record) + 1, start: record.start, end: record.end, entries: [] };
      sections.push(current);
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(current);
      continue;
    }
    let equals = -1;
    for (let index = start; index < record.contentEnd; index += 1) {
      if (source[index] === 0x3d) { equals = index; break; }
    }
    if (equals < 0 || !current) continue;
    const keyEnd = trimEnd(source, start, equals);
    if (keyEnd <= start) continue;
    const valueStart = trimStart(source, equals + 1, record.contentEnd);
    const valueEnd = trimEnd(source, valueStart, record.contentEnd);
    current.entries.push({
      key: source.subarray(start, keyEnd).toString('latin1'),
      line: records.indexOf(record) + 1,
      keyStart: start,
      keyEnd,
      valueStart,
      valueEnd,
      raw: source.subarray(valueStart, valueEnd).toString('latin1'),
      bytes: Buffer.from(source.subarray(valueStart, valueEnd))
    });
  }
  return {
    source,
    records,
    sections,
    byName,
    newline: {
      crlf: records.filter(record => record.newline === 'CRLF').length,
      lf: records.filter(record => record.newline === 'LF').length,
      finalTerminator: records.at(-1)?.newline || ''
    }
  };
}

function find(parsed, sectionName, key, occurrence = 0) {
  const sections = parsed.byName.get(sectionName) || [];
  const entries = sections.flatMap(section => section.entries.filter(entry => entry.key === key));
  assert.ok(entries[occurrence], `INI key does not exist: [${sectionName}] ${key}`);
  return entries[occurrence];
}

function encode(value) {
  if (!Buffer.isBuffer(value)) {
    const text = String(value);
    for (const character of text) assert.ok(character.codePointAt(0) <= 0xff, 'Cannot encode INI value outside Latin-1');
  }
  const bytes = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(String(value), 'latin1');
  for (const byte of bytes) {
    assert.notEqual(byte, 0x00, 'INI value cannot contain NUL');
    assert.notEqual(byte, 0x0a, 'INI value cannot contain LF');
    assert.notEqual(byte, 0x0d, 'INI value cannot contain CR');
  }
  return bytes;
}

function replaceValue(parsed, entry, replacement) {
  return Buffer.concat([parsed.source.subarray(0, entry.valueStart), encode(replacement), parsed.source.subarray(entry.valueEnd)]);
}

function replace(parsed, sectionName, key, replacement, occurrence = 0) {
  return replaceValue(parsed, find(parsed, sectionName, key, occurrence), replacement);
}

function roundTrip(parsed) {
  return Buffer.from(parsed.source);
}

module.exports = { parse, find, replaceValue, replace, roundTrip, encode };
