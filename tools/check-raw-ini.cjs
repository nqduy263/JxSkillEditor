// P1 INI span checks against the real client enum/label files.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const Ini = require('./raw-ini.cjs');

const studio = path.resolve(__dirname, '..');
const root = path.resolve(studio, '..');
const files = [
  { path: 'Client6.0/settings/gamesetting.ini', section: 'SkillAttrib', key: '101' },
  { path: 'Client6.0/settings/skilltemplate.txt', section: 'SkillStyle', key: 'Value' }
];
const passed = [];
function check(name, fn) { fn(); passed.push(name); }

const parsed = files.map(item => ({ ...item, source: fs.readFileSync(path.join(root, item.path)), parsed: null }));
for (const item of parsed) item.parsed = Ini.parse(item.source);

check('Gamesetting and skilltemplate round-trip without edits', () => {
  for (const item of parsed) assert.deepEqual(Ini.roundTrip(item.parsed), item.source);
});
check('Sections and values expose byte spans', () => {
  assert.ok(parsed[0].parsed.sections.length >= 20);
  assert.ok(parsed[1].parsed.sections.length > 10);
  for (const item of parsed) {
    const entry = Ini.find(item.parsed, item.section, item.key);
    assert.ok(entry.valueStart <= entry.valueEnd);
    assert.equal(item.source.subarray(entry.valueStart, entry.valueEnd).toString('latin1'), entry.raw);
  }
});
check('Values containing equals signs stay intact', () => {
  const entry = Ini.find(parsed[0].parsed, 'SkillAttrib', '101');
  assert.ok(entry.raw.includes('<color='));
});
check('One-value replacement preserves surrounding bytes and section', () => {
  const item = parsed[1];
  const entry = Ini.find(item.parsed, item.section, item.key);
  const replacement = entry.raw + '_P1';
  const edited = Ini.replace(item.parsed, item.section, item.key, replacement);
  assert.deepEqual(edited.subarray(0, entry.valueStart), item.source.subarray(0, entry.valueStart));
  assert.deepEqual(edited.subarray(entry.valueStart + replacement.length), item.source.subarray(entry.valueEnd));
  const reparsed = Ini.parse(edited);
  assert.equal(Ini.find(reparsed, item.section, item.key).raw, replacement);
});
check('Comments, CRLF/LF style and invalid values are handled safely', () => {
  assert.ok(parsed[0].parsed.newline.lf > 0);
  assert.ok(parsed[1].parsed.newline.crlf > 0);
  assert.throws(() => Ini.replace(parsed[0].parsed, 'SkillAttrib', '101', 'bad\nvalue'), /LF/);
  assert.throws(() => Ini.replace(parsed[0].parsed, 'SkillAttrib', '101', '🐉'), /Latin-1/);
  assert.throws(() => Ini.find(parsed[0].parsed, 'Missing', '101'), /does not exist/);
});

const report = {
  checkedAt: new Date().toISOString(),
  sources: files.map(item => item.path),
  sections: parsed.reduce((sum, item) => sum + item.parsed.sections.length, 0),
  passed: passed.length,
  checks: passed,
  writesToGame: false,
  output: 'evidence/raw-ini-checks.json'
};
fs.writeFileSync(path.join(studio, 'evidence', 'raw-ini-checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
