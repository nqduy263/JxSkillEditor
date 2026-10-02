// Read-only WSL snapshot. No commands that change the running game.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const out=path.resolve(__dirname,'../evidence');
const sources=[['/home/jxser_bachkim_6.0/server1/script/global/skills_table.lua','live_skills_table.lua'],['/home/jxser_bachkim_6.0/server1/settings/skills.txt','live_skills.txt']];
const entries=[];
for(const [remote,name]of sources){const r=spawnSync('wsl.exe',['-d','VLTK_Offline','--','base64','-w0',remote],{encoding:'utf8',maxBuffer:10*1024*1024});if(r.status!==0)throw Error(r.stderr||'WSL read failed');const bytes=Buffer.from(r.stdout.trim(),'base64');if(!bytes.length)throw Error('Empty snapshot');fs.writeFileSync(path.join(out,name),bytes);entries.push({remote,local:'SkillStudio/evidence/'+name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
const report={capturedAt:new Date().toISOString(),distro:'VLTK_Offline',serverRoot:'/home/jxser_bachkim_6.0/server1',clientExecutables:['E:/Game/VLTK/VLTK_DEV_V2/Client6.0/game.exe','E:/Game/VLTK/VLTK_DEV_V2/Client6.0/game_offline.exe'],processEvidence:'Read-only process inspection in this session; executable paths verified. No in-memory skill list read.',files:entries};
fs.writeFileSync(path.join(out,'live-source.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
