// P0 read-only profile audit for the active JX Linux 6.0 / Client6.0 workspace.
// This script fingerprints source files and package metadata only. It never writes
// to the client or server roots and never starts, stops, or reloads a game service.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../..');
const studio = path.join(root, 'SkillStudio');
const client = path.join(root, 'Client6.0');
const server = path.join(root, 'Server 6.0', 'server_moi', 'jxser_bachkim_6.0', 'server1');
const out = path.join(studio, 'evidence', 'profile-audit.json');

function sha256(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytes = 0;
    for (;;) {
      const n = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (!n) break;
      bytes += n;
      hash.update(buffer.subarray(0, n));
    }
    return { bytes, sha256: hash.digest('hex') };
  } finally {
    fs.closeSync(fd);
  }
}

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function source(file, role, required = true) {
  if (!fs.existsSync(file)) return { path: rel(file), role, required, exists: false };
  const stat = fs.statSync(file);
  const digest = sha256(file);
  const bytes = fs.readFileSync(file);
  const crlf = (bytes.toString('latin1').match(/\r\n/g) || []).length;
  const lf = (bytes.toString('latin1').match(/(?<!\r)\n/g) || []).length;
  return { path: rel(file), role, required, exists: true, bytes: digest.bytes, sha256: digest.sha256, crlf, lf };
}

function latin(file) {
  return fs.readFileSync(file).toString('latin1');
}

function tableSummary(file, idField) {
  if (!fs.existsSync(file)) return { path: rel(file), exists: false };
  const text = latin(file);
  const lines = text.split(/\r?\n/);
  const headers = (lines[0] || '').split('\t');
  const idIndex = headers.indexOf(idField);
  const ids = [];
  const duplicates = new Map();
  let rows = 0;
  for (let line = 1; line < lines.length; line += 1) {
    if (!lines[line].trim()) continue;
    rows += 1;
    const cells = lines[line].split('\t');
    const raw = idIndex >= 0 ? cells[idIndex] : '';
    const id = Number.parseInt(raw, 10);
    if (!Number.isNaN(id)) {
      ids.push(id);
      const prior = duplicates.get(id) || [];
      prior.push(line + 1);
      duplicates.set(id, prior);
    }
  }
  return {
    path: rel(file),
    exists: true,
    headerColumns: headers.length,
    headers,
    rows,
    numericIds: ids.length,
    minId: ids.length ? Math.min(...ids) : null,
    maxId: ids.length ? Math.max(...ids) : null,
    duplicates: [...duplicates.entries()].filter(([, lines]) => lines.length > 1).map(([id, lines]) => ({ id, lines }))
  };
}

function parsePackage(file) {
  if (!fs.existsSync(file)) return { path: rel(file), exists: false, entries: [] };
  const lines = latin(file).split(/\r?\n/);
  const entries = [];
  let packagePath = null;
  for (const line of lines) {
    const m = /^Path=(.*)$/.exec(line.trim());
    if (m) packagePath = m[1].trim();
    const e = /^(\d+)=(.+)$/.exec(line.trim());
    if (!e) continue;
    const archive = e[2].trim();
    const full = path.join(client, 'data', archive);
    const item = { order: Number(e[1]), name: archive, path: rel(full), exists: fs.existsSync(full) };
    if (item.exists) {
      item.bytes = fs.statSync(full).size;
      item.sha256 = sha256(full).sha256;
    }
    entries.push(item);
  }
  return { path: rel(file), exists: true, packagePath, entries };
}

function listLuaSummary(dir) {
  if (!fs.existsSync(dir)) return { path: rel(dir), exists: false, files: 0 };
  const files = [];
  function walk(current) {
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, item.name);
      if (item.isDirectory()) walk(full);
      else if (item.isFile() && item.name.toLowerCase().endsWith('.lua')) files.push(full);
    }
  }
  walk(dir);
  const hash = crypto.createHash('sha256');
  for (const file of files.sort()) hash.update(Buffer.from(rel(file) + '\0')).update(fs.readFileSync(file));
  return { path: rel(dir), exists: true, files: files.length, contentIndexSha256: hash.digest('hex') };
}

const clientSkills = path.join(client, 'settings', 'skills.txt');
const clientMissiles = path.join(client, 'settings', 'missles.txt');
const serverSkills = path.join(server, 'settings', 'skills.txt');
const serverMissiles = path.join(server, 'settings', 'missles.txt');
const packageIni = path.join(client, 'package.ini');
const liveSourceFile = path.join(studio, 'evidence', 'live-source.json');
const live = fs.existsSync(liveSourceFile) ? JSON.parse(fs.readFileSync(liveSourceFile, 'utf8')) : null;

const files = [
  source(clientSkills, 'client skill table'),
  source(clientMissiles, 'client missile table'),
  source(packageIni, 'client package order'),
  source(path.join(client, 'settings', 'skilltemplate.txt'), 'client enum/template'),
  source(path.join(client, 'settings', 'missletemplate.txt'), 'client missile enum/template'),
  source(path.join(client, 'settings', 'gamesetting.ini'), 'client labels/enums'),
  source(path.join(client, 'settings', 'faction', 'ÃÅÅÉÉè¶¨.ini'), 'client faction catalog'),
  source(path.join(client, 'settings', 'npcres', 'npc¶¯×÷±í.txt'), 'client action enum'),
  source(path.join(client, 'settings', 'npcres', 'ÈËÎïÀàÐÍ.txt'), 'client character profile enum'),
  source(path.join(root, 'Simcity', 'tcvn3.py'), 'TCVN3 codec'),
  source(serverSkills, 'server skill table'),
  source(serverMissiles, 'server missile table'),
  source(path.join(server, 'script', 'global', 'skills_table.lua'), 'server live skill index'),
  source(path.join(studio, 'evidence', 'live_skills.txt'), 'captured WSL skill table'),
  source(path.join(studio, 'evidence', 'live_skills_table.lua'), 'captured WSL skill index')
];

const packageOrder = parsePackage(packageIni);
const clientTable = tableSummary(clientSkills, 'SkillId');
const serverTable = tableSummary(serverSkills, 'SkillId');
const clientMissileTable = tableSummary(clientMissiles, 'MissleId');
const serverMissileTable = tableSummary(serverMissiles, 'MissleId');
const requiredMissing = files.filter(item => item.required && !item.exists).map(item => item.path);
const sourceMismatch = [];
if (clientTable.exists && serverTable.exists && clientTable.headerColumns !== serverTable.headerColumns) sourceMismatch.push('client/server skills header column count differs');
if (clientMissileTable.exists && serverMissileTable.exists && clientMissileTable.headerColumns !== serverMissileTable.headerColumns) sourceMismatch.push('client/server missiles header column count differs');
if (clientSkills !== serverSkills && files.find(x => x.path === rel(clientSkills))?.sha256 !== files.find(x => x.path === rel(serverSkills))?.sha256) sourceMismatch.push('client/server skills bytes differ');

const unknowns = [
  { key: 'pak-precedence', status: 'unknown', detail: 'package.ini order is observed; engine runtime precedence and loose override behavior are not verified' },
  { key: 'skill-id-limit', status: 'unknown', detail: 'no active binary/profile evidence establishes the maximum safe SkillId or MissleId' },
  { key: 'duplicate-521', status: clientTable.duplicates.some(x => x.id === 521) ? 'warning' : 'pass', detail: 'source table contains duplicate SkillId 521; handling is not inferred' },
  { key: 'faction-coverage', status: 'warning', detail: 'faction catalog contains 13 groups, while only the captured learning references establish 170 learnable skills; other rows remain script-only/internal/NPC/unknown' },
  { key: 'action-14', status: 'unknown', detail: 'NpcAction source currently maps 0–13; CharAnimId 14 remains without verified runtime mapping' },
  { key: 'cast-timing', status: 'unknown', detail: '18 ticks/second is a profile assumption for preview; live engine timing is not verified' },
  { key: 'pak-license', status: 'review', detail: 'private game assets are used for local development evidence and must not be redistributed in public releases' }
];

const report = {
  schema: 'jx-skill-studio/profile-audit/v1',
  generatedAt: new Date().toISOString(),
  profileId: null,
  target: { client: 'JX1 Client6.0', server: 'JX Linux 6.0', distro: live?.distro || 'VLTK_Offline', serverRoot: live?.serverRoot || null },
  roots: {
    client: { path: rel(client), exists: fs.existsSync(client), executableCandidates: ['game.exe', 'game_offline.exe'].map(name => ({ name, exists: fs.existsSync(path.join(client, name)) })) },
    server: { path: rel(server), exists: fs.existsSync(server), settingsExists: fs.existsSync(path.join(server, 'settings')), scriptExists: fs.existsSync(path.join(server, 'script')) }
  },
  files,
  tables: { clientSkills: clientTable, serverSkills: serverTable, clientMissiles: clientMissileTable, serverMissiles: serverMissileTable },
  packageOrder,
  serverLua: listLuaSummary(path.join(server, 'script', 'skill')),
  capturedSnapshot: live,
  sourceMismatch,
  gates: {
    activeRoots: files.every(x => !x.required || x.exists) ? 'pass' : 'blocked',
    sourceHashes: files.every(x => !x.required || (x.exists && x.sha256)) ? 'pass' : 'blocked',
    tableSchema: sourceMismatch.filter(x => x.includes('header')).length ? 'warning' : 'pass',
    packagePrecedence: 'unknown',
    engineIdLimits: 'unknown',
    liveGameVerification: 'not-started'
  },
  unknowns,
  safety: { mode: 'read-only', clientServerWrites: false, sshConnections: false, processMemoryReads: false, serviceLifecycleChanges: false },
  requiredMissing
};

const profileHash = crypto.createHash('sha256').update(JSON.stringify({
  target: report.target,
  roots: report.roots,
  files: report.files.map(x => ({ path: x.path, sha256: x.sha256, bytes: x.bytes })),
  package: report.packageOrder.entries.map(x => ({ order: x.order, name: x.name, sha256: x.sha256, bytes: x.bytes })),
  tables: report.tables
})).digest('hex');
report.profileId = `jx6-client6-${profileHash.slice(0, 16)}`;

fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ profileId: report.profileId, generatedAt: report.generatedAt, requiredMissing, packageEntries: packageOrder.entries.length, clientSkills: clientTable.rows, serverSkills: serverTable.rows, unknowns: unknowns.length, output: rel(out) }, null, 2));
