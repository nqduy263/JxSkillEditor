// P1 Lua span checks against a real Client6.0 Lua 4.x skill source.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const Lua = require('./raw-lua.cjs');

const studio = path.resolve(__dirname, '..');
const root = path.resolve(studio, '..');
const relative = 'Client6.0/script/skill/wudang.lua';
const source = fs.readFileSync(path.join(root, relative));
const parsed = Lua.parse(source);
const passed = [];
function check(name, fn) {
  fn();
  passed.push(name);
}

check('Lua round-trip without edits is byte-identical', () => {
  assert.deepEqual(Lua.roundTrip(parsed), source);
});
check('Token parser finds real skill tables and byte spans', () => {
  assert.ok(Object.keys(parsed.tables).length > 10);
  const value = Lua.field(parsed, 'wudang_jianfa', 'addphysicsdamage_p');
  assert.ok(value.raw.startsWith('{{{1,'));
  assert.equal(source.subarray(value.byteStart, value.byteEnd).toString('latin1'), value.raw);
  assert.ok(value.line >= 1);
});
check('In-memory literal replacement preserves prefix and suffix bytes', () => {
  const value = Lua.field(parsed, 'wudang_jianfa', 'addphysicsdamage_p');
  const replacement = value.raw.replace('{20,215}', '{20,216}');
  const edited = Lua.replaceField(parsed, 'wudang_jianfa', 'addphysicsdamage_p', replacement);
  assert.deepEqual(edited.subarray(0, value.byteStart), source.subarray(0, value.byteStart));
  assert.deepEqual(edited.subarray(value.byteStart + replacement.length), source.subarray(value.byteEnd));
  const reparsed = Lua.parse(edited);
  assert.equal(Lua.field(reparsed, 'wudang_jianfa', 'addphysicsdamage_p').raw, replacement);
});
check('Comments and non-target tables remain present after a staged edit', () => {
  const value = Lua.field(parsed, 'wudang_jianfa', 'addphysicsdamage_p');
  const edited = Lua.replaceSpan(parsed, value, value.raw.replace('{20,215}', '{20,216}'));
  assert.ok(edited.toString('latin1').includes('--'));
  assert.ok(Lua.parse(edited).tables.nulei_zhi);
});
check('Unsafe replacement bytes and missing fields fail before staging', () => {
  assert.throws(() => Lua.replaceField(parsed, 'wudang_jianfa', 'addphysicsdamage_p', 'bad\u0000literal'), /NUL/);
  assert.throws(() => Lua.replaceField(parsed, 'missing_table', 'x', '0'), /table does not exist/);
  assert.throws(() => Lua.replaceField(parsed, 'wudang_jianfa', 'missing_property', '0'), /property does not exist/);
  assert.throws(() => Lua.replaceField(parsed, 'wudang_jianfa', 'addphysicsdamage_p', '🐉'), /Latin-1/);
});

const fields = Object.values(parsed.tables).flatMap(table => Object.values(table));
const report = {
  checkedAt: new Date().toISOString(),
  source: relative,
  bytes: source.length,
  tables: Object.keys(parsed.tables).length,
  fields: fields.length,
  passed: passed.length,
  checks: passed,
  executesLua: false,
  writesToGame: false,
  output: 'evidence/raw-lua-checks.json'
};
fs.writeFileSync(path.join(studio, 'evidence', 'raw-lua-checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
