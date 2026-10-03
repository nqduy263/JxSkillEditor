// Stage-only patch planner for the JX Skill Studio changeset format.
//
// This module never writes a Client/Server file, opens SSH, executes Lua, or
// mutates a PAK.  It turns a verified changeset into byte-range operations with
// source and result hashes.  A later deployer can consume this manifest only
// after adding its own backup, journal, approval and read-back gates.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const Tsv = require('./raw-tsv.cjs');
const Lua = require('./raw-lua.cjs');

const SCHEMA = 'jx-skill-studio-staged-patch/v1';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function asBuffer(value, label = 'source') {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  throw new TypeError(`${label} must be a Buffer or Uint8Array`);
}

function normalizeRelative(value, label = 'path') {
  assert.equal(typeof value, 'string', `${label} must be a string`);
  assert.ok(value.length > 0 && value.length <= 1024, `${label} is empty or too long`);
  assert.ok(!value.includes('\0'), `${label} contains NUL`);
  const slash = value.replaceAll('\\', '/');
  assert.ok(!slash.startsWith('/') && !/^[A-Za-z]:\//.test(slash), `${label} must be relative`);
  const parts = slash.split('/');
  assert.ok(!parts.some(part => part === '..'), `${label} cannot escape the workspace`);
  assert.ok(parts.every(part => part && part !== '.'), `${label} contains an empty component`);
  return parts.join('/');
}

function resolveUnder(root, relative, label = 'path') {
  const safe = normalizeRelative(relative, label);
  const rootPath = path.resolve(root);
  const target = path.resolve(rootPath, safe.replaceAll('/', path.sep));
  assert.ok(target === rootPath || target.startsWith(rootPath + path.sep), `${label} escapes the workspace`);
  return { relative: safe, absolute: target };
}

function profileEntry(profile, relative) {
  if (!profile || typeof profile !== 'object') return null;
  const safe = normalizeRelative(relative);
  return (profile.files || []).find(item => normalizeRelative(item.path) === safe) || null;
}

function verifyProfileSource(profile, relative, source) {
  const entry = profileEntry(profile, relative);
  assert.ok(entry, `Profile does not contain source: ${relative}`);
  const digest = { bytes: source.length, sha256: sha256(source) };
  assert.equal(entry.exists, true, `Profile source is not present: ${relative}`);
  assert.equal(digest.bytes, entry.bytes, `Profile byte count changed: ${relative}`);
  assert.equal(digest.sha256, entry.sha256, `Profile hash changed: ${relative}`);
  return digest;
}

function assertEditShape(edit, source) {
  assert.ok(Number.isInteger(edit.start) && Number.isInteger(edit.end), 'Edit span must be integer offsets');
  assert.ok(edit.start >= 0 && edit.end >= edit.start && edit.end <= source.length, 'Edit span is outside source');
  assert.equal(typeof edit.before, 'string', 'Edit before must be a Latin-1 string');
  assert.equal(typeof edit.after, 'string', 'Edit after must be a Latin-1 string');
  assert.deepEqual(source.subarray(edit.start, edit.end), Buffer.from(edit.before, 'latin1'), 'Edit before bytes do not match source');
}

function applyEdits(sourceInput, edits) {
  const source = asBuffer(sourceInput);
  const ordered = edits.map(edit => ({ ...edit })).sort((a, b) => b.start - a.start || b.end - a.end);
  let next = source;
  let previousStart = source.length + 1;
  for (const edit of ordered) {
    assertEditShape(edit, source);
    assert.ok(edit.end <= previousStart, 'Overlapping byte edits are not allowed');
    previousStart = edit.start;
    const replacement = Buffer.from(edit.after, 'latin1');
    next = Buffer.concat([next.subarray(0, edit.start), replacement, next.subarray(edit.end)]);
  }
  return next;
}

function operation({ relative, role, kind, source, edits, profileDigest, notes = [] }) {
  const before = asBuffer(source);
  const after = applyEdits(before, edits);
  return {
    id: `${role}:${relative}`,
    role,
    path: normalizeRelative(relative),
    kind,
    mode: 'stage-only',
    backupRequired: true,
    writesToGame: false,
    precondition: profileDigest || { bytes: before.length, sha256: sha256(before) },
    result: { bytes: after.length, sha256: sha256(after) },
    edits: edits.map(edit => ({
      start: edit.start,
      end: edit.end,
      before: edit.before,
      after: edit.after,
      ...(edit.meta ? { meta: edit.meta } : {})
    })),
    notes
  };
}

function recordsFromChanges(list, idKey) {
  return (Array.isArray(list) ? list : []).map(record => {
    assert.ok(record && Number.isSafeInteger(record.id) && record.id > 0, `Invalid ${idKey} record ID`);
    assert.equal(typeof record.isNew, 'boolean', `Missing isNew for ${idKey} #${record.id}`);
    let fields = record.fields;
    // Exported v0.4 changesets keep a compact diff in fields and the complete
    // row in draft.  Workspace v1 keeps the complete row in fields.
    let expected = (record.expected && typeof record.expected === 'object' && !Array.isArray(record.expected)) ? record.expected : {};
    if (Array.isArray(fields)) {
      expected = Object.fromEntries(fields.map(change => [change.field, String(change.before ?? '')]));
      fields = Object.fromEntries(fields.map(change => {
        assert.ok(change && typeof change.field === 'string', `Invalid ${idKey} diff`);
        return [change.field, String(change.after ?? '')];
      }));
    } else if (record.draft && typeof record.draft === 'object' && !Array.isArray(record.draft)) {
      fields = record.draft;
    }
    assert.ok(fields && typeof fields === 'object' && !Array.isArray(fields), `Missing ${idKey} fields #${record.id}`);
    return { id: record.id, isNew: record.isNew, fields, expected };
  });
}

function planTsv({ relative, source, profile, idField, records, role = 'client', kind = 'tsv' }) {
  const input = asBuffer(source, relative);
  const digest = verifyProfileSource(profile, relative, input);
  const parsed = Tsv.parse(input);
  const idIndex = parsed.headers.indexOf(idField);
  assert.ok(idIndex >= 0, `TSV ID column missing: ${idField}`);
  const edits = [];
  const blocked = [];
  const seen = new Set();
  for (const record of recordsFromChanges(records, idField)) {
    if (seen.has(record.id)) throw new Error(`Duplicate ${idField} #${record.id}`);
    seen.add(record.id);
    if (record.isNew) {
      blocked.push({ id: record.id, kind: 'insert-row', reason: 'New TSV rows require a profile-specific serializer and are not staged automatically.' });
      continue;
    }
    const matches = parsed.rows.filter(row => row.values[idField] === String(record.id));
    if (matches.length !== 1) {
      blocked.push({ id: record.id, kind: 'row-identity', reason: `${matches.length} source rows match ${idField} #${record.id}; no last-wins inference.` });
      continue;
    }
    const row = matches[0];
    for (const [field, value] of Object.entries(record.fields)) {
      if (field === idField || value === undefined) continue;
      const column = parsed.headers.indexOf(field);
      if (column < 0) {
        blocked.push({ id: record.id, field, kind: 'unknown-column', reason: `Column ${field} is not in the source header.` });
        continue;
      }
      const cell = row.cells[column];
      if (!cell) {
        blocked.push({ id: record.id, field, kind: 'missing-cell', reason: 'Source row is shorter than the header; a profile serializer is required.' });
        continue;
      }
      const after = String(value);
      if (Object.hasOwn(record.expected, field) && cell.raw !== record.expected[field]) {
        blocked.push({ id: record.id, field, kind: 'span-conflict', reason: 'TSV before value no longer matches the source.' });
        continue;
      }
      if (cell.raw === after) continue;
      const encoded = Tsv.encodeCell(after);
      edits.push({
        start: cell.start,
        end: cell.end,
        before: cell.raw,
        after: encoded.toString('latin1'),
        meta: { id: record.id, field, line: row.line }
      });
    }
  }
  const op = edits.length ? operation({ relative, role, kind, source: input, edits, profileDigest: digest }) : null;
  return { operation: op, blocked, changed: edits.length, source: digest };
}

function planLua({ relative, source, profileHash, formulas, role = 'client' }) {
  const input = asBuffer(source, relative);
  const actualHash = sha256(input);
  assert.ok(typeof profileHash === 'string' && /^[a-f0-9]{64}$/.test(profileHash), `Lua source hash is required: ${relative}`);
  assert.equal(actualHash, profileHash, `Lua source hash changed: ${relative}`);
  const parsed = Lua.parse(input);
  const edits = [];
  const blocked = [];
  const seen = new Set();
  for (const formula of Array.isArray(formulas) ? formulas : []) {
    assert.equal(typeof formula, 'object', 'Lua formula must be an object');
    const identity = JSON.stringify([formula.key, formula.property]);
    if (seen.has(identity)) throw new Error(`Duplicate Lua formula: ${identity}`);
    seen.add(identity);
    if (formula.isNew) {
      blocked.push({ key: formula.key, property: formula.property, kind: 'insert-lua', reason: 'New Lua tables/properties require a profile-specific Lua 4 serializer.' });
      continue;
    }
    const current = Lua.field(parsed, formula.key, formula.property);
    if (formula.before !== null && formula.before !== undefined && current.raw !== formula.before) {
      blocked.push({ key: formula.key, property: formula.property, kind: 'span-conflict', reason: 'Lua literal before value no longer matches the source.' });
      continue;
    }
    const after = String(formula.after ?? '');
    if (after === current.raw) continue;
    Lua.encode(after);
    edits.push({
      start: current.byteStart,
      end: current.byteEnd,
      before: current.raw,
      after,
      meta: { table: formula.key, property: formula.property, line: current.line }
    });
  }
  const op = edits.length ? operation({ relative, role, kind: 'lua-span', source: input, edits, profileDigest: { bytes: input.length, sha256: actualHash } }) : null;
  return { operation: op, blocked, changed: edits.length, source: { bytes: input.length, sha256: actualHash } };
}

function planChangeset({ changeset, root, profile, expectedSnapshotId, role = 'client' }) {
  assert.ok(changeset && typeof changeset === 'object', 'Changeset is required');
  assert.equal(changeset.format, 'jx-skill-studio-draft/v0.4', 'Only changeset v0.4 can be staged');
  assert.equal(changeset.deployable, false, 'Only explicitly non-deployable changesets can enter the stage planner');
  assert.equal(typeof expectedSnapshotId, 'string', 'expectedSnapshotId is required');
  assert.equal(changeset.snapshotId, expectedSnapshotId, 'Changeset snapshot does not match the active snapshot');
  assert.equal(profile?.safety?.mode, 'read-only', 'Profile safety mode must be read-only');

  const workspace = changeset.workspace || {};
  const pickList = (primary, fallback) => Array.isArray(primary) && primary.length ? primary : (Array.isArray(fallback) ? fallback : []);
  const skills = pickList(changeset.skills, workspace.skills);
  const missiles = pickList(changeset.missiles, workspace.missiles);
  const formulas = pickList(changeset.formulas, workspace.formulas);
  const operations = [];
  const blocked = [];
  const roots = [];

  function read(relative) {
    const resolved = resolveUnder(root, relative);
    assert.ok(fs.existsSync(resolved.absolute), `Source file missing: ${relative}`);
    return { ...resolved, bytes: fs.readFileSync(resolved.absolute) };
  }
  function addTsv(relative, idField, rows, kind) {
    const file = read(relative);
    const planned = planTsv({ relative, source: file.bytes, profile, idField, records: rows, role, kind });
    if (planned.operation) operations.push(planned.operation);
    blocked.push(...planned.blocked.map(item => ({ ...item, path: relative })));
    roots.push({ path: relative, sha256: planned.source.sha256, bytes: planned.source.bytes });
  }

  if (skills.length) addTsv(changeset.source || 'Client6.0/settings/skills.txt', 'SkillId', skills, 'skill-tsv');
  if (missiles.length) addTsv(changeset.missileSource || 'Client6.0/settings/missles.txt', 'MissleId', missiles, 'missile-tsv');

  const formulasByPath = new Map();
  for (const formula of formulas) {
    const source = normalizeRelative(formula.source || formula.script, 'Lua source');
    const list = formulasByPath.get(source) || [];
    list.push(formula);
    formulasByPath.set(source, list);
  }
  for (const [relative, list] of formulasByPath) {
    const file = read(relative);
    assert.ok(list.every(formula => formula.sourceHash === list[0].sourceHash), `Conflicting Lua source hashes: ${relative}`);
    const planned = planLua({ relative, source: file.bytes, profileHash: list[0].sourceHash, formulas: list, role });
    if (planned.operation) operations.push(planned.operation);
    blocked.push(...planned.blocked.map(item => ({ ...item, path: relative })));
    roots.push({ path: relative, sha256: planned.source.sha256, bytes: planned.source.bytes });
  }
  const assets = pickList(changeset.assets, workspace.assets);
  for (const asset of assets) {
    blocked.push({ skillId: asset.skillId, kind: 'spr-conversion', reason: 'PNG/JPEG preview has no SPR conversion operation; asset remains review-only.' });
  }

  return {
    schema: SCHEMA,
    createdAt: new Date().toISOString(),
    snapshotId: changeset.snapshotId,
    profileId: profile.profileId,
    mode: 'stage-only',
    deployable: false,
    writesToGame: false,
    roots,
    operations,
    blocked,
    gates: {
      profile: 'pass',
      sourceHashes: 'pass',
      backup: 'required-before-apply',
      journal: 'required-before-apply',
      readBack: 'required-after-apply',
      pakPrecedence: profile.gates?.packagePrecedence || 'unknown',
      engineIdLimits: profile.gates?.engineIdLimits || 'unknown',
      liveGameVerification: profile.gates?.liveGameVerification || 'not-started'
    }
  };
}

module.exports = { SCHEMA, sha256, normalizeRelative, resolveUnder, applyEdits, planTsv, planLua, planChangeset };
