const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {root,decode,read,table,ini,luaTables,encoding}=require('./client-data.cjs');
const output=path.resolve(__dirname,'..');
const source='Client6.0/settings/skills.txt',missileSource='Client6.0/settings/missles.txt';
const learnSource='SkillStudio/evidence/live_skills_table.lua';
const factionSource='Client6.0/settings/faction/ÃÅÅÉÉè¶¨.ini';
const skillTable=table(source),missileTable=table(missileSource),settings=ini('Client6.0/settings/gamesetting.ini');
const factions=Object.values(ini(factionSource)).filter(s=>s.Name&&s.ShowName).map(s=>({key:s.Name,name:decode(s.ShowName)}));
const shortNames={sl:'shaolin',tw:'tianwang',tm:'tangmen',wu:'wudu',em:'emei',cy:'cuiyan',gb:'gaibang',tr:'tianren',wd:'wudang',kl:'kunlun',hs:'huashan'};
const learned=new Map();let faction=null;
read(learnSource).split(/\r?\n/).forEach((line,i)=>{const clean=line.split('--')[0];const fn=/^function\s+(\w+)\(/.exec(clean);if(fn)faction=shortNames[fn[1].replace(/^add_/,'')]||null;if(faction)for(const m of clean.matchAll(/\bAddMagic\(\s*(\d+)/g))learned.set(Number(m[1]),{faction,source:learnSource,line:i+1});});
const iconRoot=path.join(root,'Simcity/web/assets/skill_icons'),iconSet=new Map(fs.readdirSync(iconRoot).map(x=>[x.toLowerCase(),x]));
const icons={},scripts={},evidencePaths=new Set([source,missileSource,learnSource,factionSource,'Client6.0/settings/gamesetting.ini','Simcity/tcvn3.py']);
const invalid=[],duplicates=[],seen=new Map();
function iconFor(raw,id){const base=raw.split(/[\\/]/).pop().replace(/\.spr$/i,'.png');const direct=iconSet.get(base.toLowerCase());const file=direct||iconSet.get('sk_'+id+'.png');if(!file)return null;if(!icons[file])icons[file]='data:image/png;base64,'+fs.readFileSync(path.join(iconRoot,file)).toString('base64');return {key:file,match:direct?'Tên tài nguyên SkillIcon':'PNG theo ID · chưa đối chiếu SPR'};}
function scriptFor(raw){if(!raw)return null;const relative='Client6.0/'+raw.replace(/\\/g,'/').replace(/^\//,'');const full=path.resolve(root,relative);if(!full.startsWith(path.join(root,'Client6.0')+path.sep)||!fs.existsSync(full))return null;if(!scripts[raw]){const content=read(relative);scripts[raw]={path:relative,sha256:crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex'),tables:luaTables(content),evaluator:/p1\s*=\s*floor\(Link\(level,SKILLS\[data\]\[levelname\]\[1\]\)\)/.test(content)?'floor-link':'unknown'};evidencePaths.add(relative);}return raw;}
const skills=skillTable.rows.flatMap(row=>{
 const raw=row.raw,id=Number(raw.SkillId);if(!/^\d+$/.test(raw.SkillId)||id<=0){invalid.push({line:row.line,id:raw.SkillId});return [];}
 if(seen.has(id))duplicates.push({id,lines:[seen.get(id),row.line]});seen.set(id,row.line);
 const learn=learned.get(id),scriptName=raw.LvlSetScript.split(/[\\/]/).pop().replace(/\.lua$/i,'');
 const f=learn?.faction||(factions.some(f=>f.key===scriptName)?scriptName:null);
 const fields={...raw};for(const k of ['SkillName','Property','SkillDesc','Param1Memo','Param2Memo'])fields[k]=decode(raw[k]);
 const factionInfo=factions.find(x=>x.key===f);
 return [{id,line:row.line,fields,rawNameHex:Buffer.from(raw.SkillName,'latin1').toString('hex'),faction:f||'',factionName:factionInfo?.name||'Chưa xác định',scope:learn?'learned':f?'script':'other',learn:learn||null,factionEvidence:learn?'Lệnh học AddMagic':'Tên file LvlSetScript',icon:iconFor(raw.SkillIcon,id),script:scriptFor(raw.LvlSetScript)}];
});
const byId=new Map();for(const s of skills)byId.set(s.id,s);
const catalog=[...byId.values()].sort((a,b)=>a.id-b.id);
const missiles=missileTable.rows.filter(r=>/^\d+$/.test(r.raw.MissleId)).map(r=>({id:Number(r.raw.MissleId),line:r.line,fields:{...r.raw,MissleName:decode(r.raw.MissleName)}}));
const displaySettings=Object.fromEntries(['WeaponLimit','SkillAttrib'].map(k=>[k,Object.fromEntries(Object.entries(settings[k]||{}).map(([key,value])=>[key,decode(value)]))]));
const coverage={rawRows:skills.length,rows:catalog.length,icons:catalog.filter(s=>s.icon).length,learned:catalog.filter(s=>s.scope==='learned').length,script:catalog.filter(s=>s.scope==='script').length,missiles:missiles.length,scripts:Object.keys(scripts).length,factions:factions.length};
const files=[...evidencePaths].map(relative=>{const bytes=fs.readFileSync(path.join(root,relative));return {path:relative,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
const snapshotId=crypto.createHash('sha256').update(JSON.stringify(files.map(f=>[f.path,f.sha256]).sort((a,b)=>a[0].localeCompare(b[0],'en')))).digest('hex');
const inventory={snapshotId,generatedAt:new Date().toISOString(),scope:'Verified running client root; loose-file snapshot; learning references from captured running WSL server root. No in-memory skill list read.',source,coverage,invalid,duplicates,files};
fs.mkdirSync(path.join(output,'evidence'),{recursive:true});
fs.writeFileSync(path.join(output,'evidence/inventory.json'),JSON.stringify(inventory,null,2));
fs.writeFileSync(path.join(output,'demo/data.js'),'window.JX_DEMO_DATA = '+JSON.stringify({snapshotId,encoding,source,missileSource,learnSource,factionSource,skills:catalog,missiles,scripts,icons,factions,settings:displaySettings,headers:skillTable.headers,missileHeaders:missileTable.headers,coverage,duplicates})+';\n');
fs.writeFileSync(path.join(output,'evidence/faction-catalog.json'),JSON.stringify(factions.map(f=>({...f,learned:catalog.filter(s=>s.faction===f.key&&s.scope==='learned').map(s=>({id:s.id,name:s.fields.SkillName,line:s.line,learnLine:s.learn.line})),scriptOnly:catalog.filter(s=>s.faction===f.key&&s.scope==='script').map(s=>({id:s.id,name:s.fields.SkillName,line:s.line}))})),null,2));
console.log(JSON.stringify({coverage,duplicates,invalid:invalid.length,dataBytes:fs.statSync(path.join(output,'demo/data.js')).size},null,2));
