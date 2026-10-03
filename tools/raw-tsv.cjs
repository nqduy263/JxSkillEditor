// Byte-preserving TSV reader for JX tables.
// Latin-1 is used as a one-byte view of the source; it is not a text conversion.
// The parser never writes a source file. Callers can create an edited Buffer and
// pass it through their own staged/backup workflow later.
const assert = require('assert/strict');

function asBuffer(value) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  throw new TypeError('TSV source must be a Buffer or Uint8Array');
}

function splitLines(source) {
  const records = [];
  let start = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== 0x0a) continue;
    const contentEnd = index > start && source[index - 1] === 0x0d ? index - 1 : index;
    records.push({
      start,
      contentStart: start,
      contentEnd,
      end: index + 1,
      newline: contentEnd < index ? 'CRLF' : 'LF'
    });
    start = index + 1;
  }
  if (start < source.length || records.length === 0) {
    records.push({ start, contentStart: start, contentEnd: source.length, end: source.length, newline: '' });
  }
  return records;
}

function splitCells(source, record) {
  const cells = [];
  let start = record.contentStart;
  for (let index = record.contentStart; index <= record.contentEnd; index += 1) {
    if (index !== record.contentEnd && source[index] !== 0x09) continue;
    const bytes = source.subarray(start, index);
    cells.push({
      start,
      end: index,
      bytes: Buffer.from(bytes),
      raw: bytes.toString('latin1')
    });
    start = index + 1;
  }
  return cells;
}

function parse(input) {
  const source = asBuffer(input);
  const records = splitLines(source);
  const headerRecord = records[0];
  const headerCells = splitCells(source, headerRecord);
  const headers = headerCells.map(cell => cell.raw);
  const rows = [];
  for (let recordIndex = 1; recordIndex < records.length; recordIndex += 1) {
    const record = records[recordIndex];
    if (record.contentStart === record.contentEnd) continue;
    const cells = splitCells(source, record);
    const values = Object.fromEntries(headers.map((name, column) => [name, cells[column]?.raw ?? '']));
    rows.push({
      index: rows.length,
      recordIndex,
      line: recordIndex + 1,
      start: record.start,
      end: record.end,
      cells,
      values
    });
  }
  return {
    source,
    records,
    headers,
    headerCells,
    rows,
    newline: {
      crlf: records.filter(record => record.newline === 'CRLF').length,
      lf: records.filter(record => record.newline === 'LF').length,
      finalTerminator: records.at(-1)?.newline || ''
    }
  };
}

function encodeCell(value) {
  if (!Buffer.isBuffer(value)) {
    const text = String(value);
    for (const character of text) {
      assert.ok(character.codePointAt(0) <= 0xff, 'Cannot encode TSV cell outside Latin-1');
    }
  }
  const bytes = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(String(value), 'latin1');
  for (const byte of bytes) assert.notEqual(byte, 0x09, 'TSV cell cannot contain TAB');
  for (const byte of bytes) assert.notEqual(byte, 0x0a, 'TSV cell cannot contain LF');
  for (const byte of bytes) assert.notEqual(byte, 0x0d, 'TSV cell cannot contain CR');
  for (const byte of bytes) assert.notEqual(byte, 0x00, 'TSV cell cannot contain NUL');
  return bytes;
}

function cell(parsed, rowIndex, column) {
  const row = parsed.rows[rowIndex];
  assert.ok(row, `TSV row ${rowIndex} does not exist`);
  const columnIndex = typeof column === 'number' ? column : parsed.headers.indexOf(column);
  assert.ok(columnIndex >= 0 && columnIndex < parsed.headers.length, `TSV column does not exist: ${column}`);
  return row.cells[columnIndex] || { start: row.end - 1, end: row.end - 1, bytes: Buffer.alloc(0), raw: '' };
}

function replaceCell(parsed, rowIndex, column, value) {
  const target = cell(parsed, rowIndex, column);
  const replacement = encodeCell(value);
  return Buffer.concat([parsed.source.subarray(0, target.start), replacement, parsed.source.subarray(target.end)]);
}

function roundTrip(parsed) {
  return Buffer.from(parsed.source);
}

module.exports = { parse, cell, replaceCell, roundTrip, encodeCell };
