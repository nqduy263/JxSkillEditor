// P1 byte-preserving TSV checks. Source files are read only; the edited result
// stays in memory and the report is written under SkillStudio/evidence only.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const Tsv = require('./raw-tsv.cjs');

const studio = path.resolve(__dirname, '..');
const root = path.resolve(studio, '..');
const sourcePath = path.join(root, 'Client6.0', 'settings', 'skills.txt');
const reportPath = path.join(studio, 'evidence', 'raw-tsv-checks.json');
const source = fs.readFileSync(sourcePath);
const parsed = Tsv.parse(source);
const passed = [];
function check(name, fn) {
  fn();
  passed.push(name);
}

check('Round-trip without edits is byte-identical', () => {
  assert.deepEqual(Tsv.roundTrip(parsed), source);
});
check('Client skill table keeps 113 headers and CRLF records', () => {
  assert.equal(parsed.headers.length, 113);
  assert.ok(parsed.rows.length >= 1200);
  assert.ok(parsed.newline.crlf >= parsed.rows.length);
  assert.equal(parsed.newline.lf, 0);
});
check('Every row exposes byte spans and raw one-byte cells', () => {
  for (const row of parsed.rows) {
    assert.ok(row.start < row.end);
    assert.equal(row.cells.length, parsed.headers.length);
    for (const item of row.cells) {
      assert.ok(item.start <= item.end);
      assert.equal(item.raw, item.bytes.toString('latin1'));
    }
  }
});
check('Duplicate SkillId 521 is visible without last-wins inference', () => {
  const rows = parsed.rows.filter(row => row.values.SkillId === '521');
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].line, rows[1].line);
});
check('Latin-1 keeps source bytes above ASCII intact', () => {
  const iconIndex = parsed.headers.indexOf('SkillIcon');
  assert.ok(iconIndex >= 0);
  const raw = parsed.rows.find(row => row.cells[iconIndex].bytes.some(byte => byte > 0x7f))?.cells[iconIndex];
  assert.ok(raw, 'expected at least one GBK/Mojibake path byte');
  assert.deepEqual(Buffer.from(raw.raw, 'latin1'), raw.bytes);
});
check('One-cell replacement changes only the requested span and keeps CRLF', () => {
  const rowIndex = parsed.rows.findIndex(row => row.values.SkillId === '521');
  const target = Tsv.cell(parsed, rowIndex, 'SkillName');
  const edited = Tsv.replaceCell(parsed, rowIndex, 'SkillName', 'P1_Test_Skill');
  assert.deepEqual(edited.subarray(0, target.start), source.subarray(0, target.start));
  assert.deepEqual(edited.subarray(target.start + 'P1_Test_Skill'.length), source.subarray(target.end));
  const reparsed = Tsv.parse(edited);
  assert.equal(reparsed.rows[rowIndex].values.SkillName, 'P1_Test_Skill');
  assert.equal(reparsed.newline.lf, 0);
});
check('Control bytes and non-Latin-1 input are rejected before staging', () => {
  assert.throws(() => Tsv.replaceCell(parsed, 0, 'SkillName', 'bad\tcell'), /TAB/);
  assert.throws(() => Tsv.replaceCell(parsed, 0, 'SkillName', 'bad\ncell'), /LF/);
  assert.throws(() => Tsv.replaceCell(parsed, 0, 'SkillName', '🐉'), /Cannot encode|out of range|invalid/i);
});

const report = {
  checkedAt: new Date().toISOString(),
  source: 'Client6.0/settings/skills.txt',
  bytes: source.length,
  rows: parsed.rows.length,
  headers: parsed.headers.length,
  newline: parsed.newline,
  passed: passed.length,
  checks: passed,
  writesToGame: false,
  output: 'evidence/raw-tsv-checks.json'
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
