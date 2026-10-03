// Read-only Lua 4.x source helper. It reuses the token/span parser from
// client-data.cjs and exposes minimal in-memory replacements for staged diffs.
// It never executes Lua and never writes the source file.
const assert = require('assert/strict');
const C = require('./client-data.cjs');

function asBuffer(value) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  throw new TypeError('Lua source must be a Buffer or Uint8Array');
}

function parse(input) {
  const source = asBuffer(input);
  const text = source.toString('latin1');
  return { source, text, tables: C.luaTables(text) };
}

function field(parsed, tableName, property) {
  const table = parsed.tables[tableName];
  assert.ok(table, `Lua table does not exist: ${tableName}`);
  const value = table[property];
  assert.ok(value, `Lua property does not exist: ${tableName}.${property}`);
  assert.ok(Number.isInteger(value.byteStart) && Number.isInteger(value.byteEnd));
  return value;
}

function encode(value) {
  if (!Buffer.isBuffer(value)) {
    const text = String(value);
    for (const character of text) assert.ok(character.codePointAt(0) <= 0xff, 'Cannot encode Lua source outside Latin-1');
  }
  const bytes = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(String(value), 'latin1');
  assert.ok(!bytes.includes(0), 'Lua replacement cannot contain NUL');
  return bytes;
}

function replaceSpan(parsed, span, replacement) {
  assert.ok(span.byteStart >= 0 && span.byteEnd >= span.byteStart && span.byteEnd <= parsed.source.length);
  return Buffer.concat([parsed.source.subarray(0, span.byteStart), encode(replacement), parsed.source.subarray(span.byteEnd)]);
}

function replaceField(parsed, tableName, property, replacement) {
  return replaceSpan(parsed, field(parsed, tableName, property), replacement);
}

function roundTrip(parsed) {
  return Buffer.from(parsed.source);
}

module.exports = { parse, field, replaceSpan, replaceField, roundTrip, encode };
