// Validate the P0 profile artifact without touching the Client6.0 or server roots.
// This is intentionally a read-only gate: it reads the audit JSON and hashes the
// referenced files, then writes only evidence/profile-checks.json.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');

const studio = path.resolve(__dirname, '..');
const root = path.resolve(studio, '..');
const profilePath = path.join(studio, 'evidence', 'profile-audit.json');
const reportPath = path.join(studio, 'evidence', 'profile-checks.json');

function readJson(file) {
  assert.ok(fs.existsSync(file), `Missing artifact: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function hashFile(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let bytes = 0;
  try {
    for (;;) {
      const count = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (!count) break;
      bytes += count;
      hash.update(buffer.subarray(0, count));
    }
  } finally {
    fs.closeSync(fd);
  }
  return { bytes, sha256: hash.digest('hex') };
}

function absolute(relativePath) {
  return path.resolve(root, relativePath.replaceAll('/', path.sep));
}

function assertHash(entry) {
  assert.equal(typeof entry.path, 'string', 'profile entry path');
  assert.equal(entry.exists, true, `profile entry is missing: ${entry.path}`);
  assert.match(entry.sha256, /^[0-9a-f]{64}$/, `sha256: ${entry.path}`);
  const file = absolute(entry.path);
  assert.ok(fs.existsSync(file), `referenced file missing: ${entry.path}`);
  const digest = hashFile(file);
  assert.equal(digest.bytes, entry.bytes, `byte count changed: ${entry.path}`);
  assert.equal(digest.sha256, entry.sha256, `hash changed: ${entry.path}`);
}

function recomputeProfileId(profile) {
  const profileHash = crypto.createHash('sha256').update(JSON.stringify({
    target: profile.target,
    roots: profile.roots,
    files: profile.files.map(item => ({ path: item.path, sha256: item.sha256, bytes: item.bytes })),
    package: profile.packageOrder.entries.map(item => ({
      order: item.order,
      name: item.name,
      sha256: item.sha256,
      bytes: item.bytes
    })),
    tables: profile.tables
  })).digest('hex');
  return `jx6-client6-${profileHash.slice(0, 16)}`;
}

const profile = readJson(profilePath);
assert.equal(profile.schema, 'jx-skill-studio/profile-audit/v1');
assert.match(profile.generatedAt, /^\d{4}-\d\d-\d\dT/);
assert.equal(profile.profileId, recomputeProfileId(profile), 'profileId does not match artifact contents');
assert.deepEqual(profile.requiredMissing, []);

assert.equal(profile.roots.client.exists, true);
assert.equal(profile.roots.server.exists, true);
assert.ok(profile.roots.client.executableCandidates.some(item => item.name === 'game.exe' && item.exists));
assert.ok(profile.roots.client.executableCandidates.some(item => item.name === 'game_offline.exe' && item.exists));

assert.ok(Array.isArray(profile.files) && profile.files.length >= 10);
for (const file of profile.files) {
  if (file.required) assertHash(file);
}

const packages = profile.packageOrder;
assert.equal(packages.exists, true);
assert.equal(packages.entries.length, 31, 'unexpected package count');
const packageOrders = packages.entries.map(item => item.order);
assert.deepEqual(packageOrders, Array.from({ length: 31 }, (_, index) => index));
assert.equal(new Set(packages.entries.map(item => item.name)).size, 31, 'duplicate PAK names');
for (const item of packages.entries) assertHash(item);

assert.equal(profile.tables.clientSkills.headerColumns, 113);
assert.equal(profile.tables.serverSkills.headerColumns, 113);
assert.equal(profile.tables.clientMissiles.headerColumns, 57);
assert.equal(profile.tables.serverMissiles.headerColumns, 57);
assert.ok(profile.tables.clientSkills.rows > 0);
assert.ok(profile.tables.serverSkills.rows > 0);
assert.ok(profile.tables.clientMissiles.rows > 0);
assert.ok(profile.tables.serverMissiles.rows > 0);
const duplicate521 = profile.tables.clientSkills.duplicates.find(item => item.id === 521);
assert.ok(duplicate521, 'duplicate SkillId 521 must remain visible');
assert.equal(profile.unknowns.find(item => item.key === 'duplicate-521')?.status, 'warning');

assert.equal(profile.gates.activeRoots, 'pass');
assert.equal(profile.gates.sourceHashes, 'pass');
assert.equal(profile.gates.tableSchema, 'pass');
assert.equal(profile.gates.packagePrecedence, 'unknown');
assert.equal(profile.gates.engineIdLimits, 'unknown');
assert.equal(profile.gates.liveGameVerification, 'not-started');
for (const key of ['pak-precedence', 'skill-id-limit', 'action-14', 'cast-timing', 'pak-license']) {
  assert.ok(profile.unknowns.some(item => item.key === key), `missing unknown gate: ${key}`);
}

assert.equal(profile.safety.mode, 'read-only');
for (const key of ['clientServerWrites', 'sshConnections', 'processMemoryReads', 'serviceLifecycleChanges']) {
  assert.equal(profile.safety[key], false, `safety flag ${key}`);
}
assert.ok(profile.sourceMismatch.includes('client/server skills bytes differ'));

const report = {
  checkedAt: new Date().toISOString(),
  profileId: profile.profileId,
  pass: true,
  checks: [
    'profile schema and profileId are internally consistent',
    'all required source hashes and 31 PAK hashes match the filesystem',
    'client/server skill and missile schemas remain 113/57 columns',
    'duplicate SkillId 521 is preserved as a warning',
    'precedence, ID limits, action 14, cast timing and license remain explicit unknown/review gates',
    'safety flags confirm read-only operation'
  ],
  output: 'evidence/profile-checks.json'
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
