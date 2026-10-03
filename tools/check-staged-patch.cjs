// Stage-only patch planner checks against the current snapshot.
// The test applies planned bytes in memory and verifies that the game roots do
// not change. It does not create backups, write a patch, connect SSH or touch
// a running process.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const Tsv = require('./raw-tsv.cjs');
const Lua = require('./raw-lua.cjs');
const Planner = require('./staged-patch.cjs');

const studio = path.resolve(__dirname, '..');
const root = path.resolve(studio, '..');
const profile = JSON.parse(fs.readFileSync(path.join(studio, 'evidence/profile-audit.json'), 'utf8'));
const dataContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(studio, 'demo/data.js'), 'utf8'), dataContext);
const data = dataContext.window.JX_DEMO_DATA;
const passed = [];
function check(name, fn) { fn(); passed.push(name); }
function read(relative) { return fs.readFileSync(path.join(root, relative.replaceAll('/', path.sep))); }

const skillPath = 'Client6.0/settings/skills.txt';
const missilePath = 'Client6.0/settings/missles.txt';
const luaPath = 'Client6.0/script/skill/wudang.lua';
const skillSource = read(skillPath);
const skillParsed = Tsv.parse(skillSource);
const skillIdIndex = skillParsed.headers.indexOf('SkillId');
const skillRow = skillParsed.rows.find(row => row.values.SkillId === '4');
assert.ok(skillRow, 'fixture skill #4 missing');
const nextRadius = String(Number(skillRow.values.AttackRadius || '0') + 1);

check('TSV planner emits a minimal cell edit with profile precondition', () => {
  const result = Planner.planTsv({
    relative: skillPath,
    source: skillSource,
    profile,
    idField: 'SkillId',
    records: [{ id: 4, isNew: false, fields: { AttackRadius: nextRadius }, expected: { AttackRadius: skillRow.values.AttackRadius } }],
    role: 'client',
    kind: 'skill-tsv'
  });
  assert.equal(result.blocked.length, 0);
  assert.equal(result.changed, 1);
  assert.equal(result.operation.edits.length, 1);
  assert.equal(result.operation.edits[0].meta.field, 'AttackRadius');
  const edited = Planner.applyEdits(skillSource, result.operation.edits);
  assert.equal(Tsv.parse(edited).rows.find(row => row.values.SkillId === '4').values.AttackRadius, nextRadius);
  assert.deepEqual(read(skillPath), skillSource);
});

check('TSV before mismatch is blocked and duplicate source ID never uses last-wins', () => {
  const mismatch = Planner.planTsv({ relative: skillPath, source: skillSource, profile, idField: 'SkillId', records: [{ id: 4, isNew: false, fields: { AttackRadius: nextRadius }, expected: { AttackRadius: 'stale' } }] });
  assert.equal(mismatch.operation, null);
  assert.ok(mismatch.blocked.some(item => item.kind === 'span-conflict'));
  const duplicate = Planner.planTsv({ relative: skillPath, source: skillSource, profile, idField: 'SkillId', records: [{ id: 521, isNew: false, fields: { SkillName: 'x' } }] });
  assert.ok(duplicate.blocked.some(item => item.kind === 'row-identity'));
});

check('New TSV rows are explicitly blocked for a profile adapter', () => {
  const result = Planner.planTsv({ relative: missilePath, source: read(missilePath), profile, idField: 'MissleId', records: [{ id: 999999, isNew: true, fields: { MissleName: 'New' } }] });
  assert.equal(result.operation, null);
  assert.equal(result.blocked[0].kind, 'insert-row');
});

const luaSource = read(luaPath);
const luaParsed = Lua.parse(luaSource);
const luaField = Lua.field(luaParsed, 'wudang_jianfa', 'addphysicsdamage_p');
const luaAfter = luaField.raw.replace('{20,215}', '{20,216}');

check('Lua planner preserves byte span and requires the source hash', () => {
  const result = Planner.planLua({ relative: luaPath, source: luaSource, profileHash: Planner.sha256(luaSource), formulas: [{ isNew: false, key: 'wudang_jianfa', property: 'addphysicsdamage_p', before: luaField.raw, after: luaAfter, sourceHash: Planner.sha256(luaSource) }] });
  assert.equal(result.blocked.length, 0);
  assert.equal(result.changed, 1);
  const edited = Planner.applyEdits(luaSource, result.operation.edits);
  assert.equal(Lua.field(Lua.parse(edited), 'wudang_jianfa', 'addphysicsdamage_p').raw, luaAfter);
  assert.deepEqual(read(luaPath), luaSource);
  assert.throws(() => Planner.planLua({ relative: luaPath, source: luaSource, profileHash: '0'.repeat(64), formulas: [] }), /hash changed/);
});

check('Lua staging rejects a missing source hash', () => {
  assert.throws(() => Planner.planLua({ relative: luaPath, source: luaSource, formulas: [] }), /hash is required/);
});

check('Short TSV rows cannot insert bytes inside a line terminator', () => {
  const source = Buffer.from('SkillId\tAttackRadius\r\n4\r\n', 'latin1');
  const fixtureProfile = { files: [{ path: skillPath, exists: true, bytes: source.length, sha256: Planner.sha256(source) }] };
  const result = Planner.planTsv({ relative: skillPath, source, profile: fixtureProfile, idField: 'SkillId', records: [{ id: 4, isNew: false, fields: { AttackRadius: '99' } }] });
  assert.equal(result.operation, null);
  assert.equal(result.blocked[0].kind, 'missing-cell');
});

check('Path traversal and unsafe edit overlaps fail closed', () => {
  assert.throws(() => Planner.resolveUnder(root, '../Client6.0/settings/skills.txt'), /escape/);
  assert.throws(() => Planner.applyEdits(Buffer.from('abcdef'), [{ start: 1, end: 4, before: 'bcd', after: 'x' }, { start: 3, end: 5, before: 'de', after: 'y' }]), /Overlapping/);
});

check('Changeset planner returns stage-only manifest and blocked gates', () => {
  const changeset = {
    format: 'jx-skill-studio-draft/v0.4',
    deployable: false,
    snapshotId: data.snapshotId,
    source: skillPath,
    missileSource: missilePath,
    skills: [{ id: 4, isNew: false, fields: [{ field: 'AttackRadius', before: skillRow.values.AttackRadius, after: nextRadius }] }],
    missiles: [],
    formulas: [{ isNew: false, source: luaPath, script: luaPath, key: 'wudang_jianfa', property: 'addphysicsdamage_p', before: luaField.raw, after: luaAfter, sourceHash: Planner.sha256(luaSource) }],
    assets: [{ skillId: 4, name: 'preview.png', mime: 'image/png', preview: 'data:image/png;base64,AA==' }]
  };
  const manifest = Planner.planChangeset({ changeset, root, profile, expectedSnapshotId: data.snapshotId });
  assert.equal(manifest.schema, Planner.SCHEMA);
  assert.equal(manifest.deployable, false);
  assert.equal(manifest.writesToGame, false);
  assert.equal(manifest.operations.length, 2);
  assert.ok(manifest.blocked.some(item => item.kind === 'spr-conversion'));
  assert.equal(manifest.gates.backup, 'required-before-apply');
  assert.equal(manifest.gates.readBack, 'required-after-apply');
  assert.deepEqual(read(skillPath), skillSource);
  assert.deepEqual(read(luaPath), luaSource);
  assert.throws(() => Planner.planChangeset({ changeset: { ...changeset, snapshotId: 'stale' }, root, profile, expectedSnapshotId: data.snapshotId }), /snapshot/);
});

const report = {
  checkedAt: new Date().toISOString(),
  passed: passed.length,
  checks: passed,
  mode: 'stage-only; in-memory edits; no game writes',
  writesToGame: false,
  sshConnections: false,
  executesLua: false,
  output: 'evidence/staged-patch-checks.json'
};
fs.writeFileSync(path.join(studio, 'evidence/staged-patch-checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
