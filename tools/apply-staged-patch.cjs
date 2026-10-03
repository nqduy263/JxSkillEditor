// Apply adapter for staged-patch manifests.
// Default is dry-run. Writes require an explicit caller opt-in and always use
// a backup, journal, atomic replace, read-back hash, and rollback on failure.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const Planner = require('./staged-patch.cjs');

function hash(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function stamp() { return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 15); }
function readManifest(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function targetPath(root, relative) { return Planner.resolveUnder(root, relative, 'operation path').absolute; }

function prepare(manifest, root) {
  assert.equal(manifest?.schema, Planner.SCHEMA, 'Unsupported staged patch schema');
  assert.equal(manifest.mode, 'stage-only', 'Only stage-only manifests are accepted');
  assert.ok(Array.isArray(manifest.operations), 'Manifest operations are missing');
  assert.equal(manifest.blocked?.length || 0, 0, 'Blocked changes must be resolved before apply');
  return manifest.operations.map(operation => {
    const file = targetPath(root, operation.path);
    const source = fs.readFileSync(file);
    assert.equal(hash(source), operation.precondition.sha256, `Precondition hash changed: ${operation.path}`);
    const result = Planner.applyEdits(source, operation.edits);
    assert.equal(result.length, operation.result.bytes, `Result byte count mismatch: ${operation.path}`);
    assert.equal(hash(result), operation.result.sha256, `Result hash mismatch: ${operation.path}`);
    return { operation, file, source, result };
  });
}

function applyManifest({ manifest, root, backupDir, journalFile, dryRun = true, allowWrites = false }) {
  const prepared = prepare(manifest, root);
  if (dryRun) return { mode: 'dry-run', writes: [], operations: prepared.map(x => x.operation.path) };
  assert.equal(allowWrites, true, 'Writes require explicit allowWrites=true');
  assert.ok(backupDir, 'backupDir is required for writes');
  fs.mkdirSync(backupDir, { recursive: true });
  const token = `${stamp()}-${process.pid}`;
  const journal = { schema: 'jx-skill-studio-apply-journal/v1', token, startedAt: new Date().toISOString(), status: 'prepared', root: path.resolve(root), files: [] };
  for (const item of prepared) {
    const backup = path.join(backupDir, `${token}-${path.basename(item.file)}.bak`);
    fs.copyFileSync(item.file, backup);
    journal.files.push({ path: item.operation.path, file: item.file, backup, before: hash(item.source), after: hash(item.result) });
  }
  fs.writeFileSync(journalFile || path.join(backupDir, `${token}.journal.json`), JSON.stringify(journal, null, 2) + '\n');
  try {
    for (const item of prepared) {
      const temporary = `${item.file}.${token}.tmp`;
      fs.writeFileSync(temporary, item.result);
      fs.renameSync(temporary, item.file);
      assert.equal(hash(fs.readFileSync(item.file)), hash(item.result), `Read-back hash mismatch: ${item.operation.path}`);
    }
    journal.status = 'committed'; journal.finishedAt = new Date().toISOString();
    fs.writeFileSync(journalFile || path.join(backupDir, `${token}.journal.json`), JSON.stringify(journal, null, 2) + '\n');
    return { mode: 'applied', token, writes: journal.files };
  } catch (error) {
    for (const item of journal.files) if (fs.existsSync(item.backup)) fs.copyFileSync(item.backup, item.file);
    journal.status = 'rolled-back'; journal.error = String(error.message || error); journal.finishedAt = new Date().toISOString();
    fs.writeFileSync(journalFile || path.join(backupDir, `${token}.journal.json`), JSON.stringify(journal, null, 2) + '\n');
    throw error;
  }
}

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  const manifestFile = process.argv[process.argv.indexOf('--manifest') + 1];
  const root = process.argv[process.argv.indexOf('--root') + 1];
  assert.ok(manifestFile && root, 'Usage: node tools/apply-staged-patch.cjs --manifest FILE --root DIR [--apply --allow-writes]');
  const manifest = readManifest(manifestFile);
  const result = applyManifest({ manifest, root, backupDir: path.join(path.dirname(manifestFile), 'backups'), dryRun: !args.has('--apply'), allowWrites: args.has('--allow-writes') });
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { prepare, applyManifest };
