const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const C=require('./client-data.cjs'),{PakReader}=require('./pak-reader.cjs'),Spr=require('../demo/spr.js');
const out=path.resolve(__dirname,'..'),enums={},sources=new Set(),resources=new Map();
function readTable(p){sources.add(p);return C.table(p);}
function readIni(p){sources.add(p);return C.ini(p);}
function add(raw,use){if(!raw||!raw.toLowerCase().endsWith('.spr'))return;const found=resources.get(raw)||{path:raw,uses:[]};if(!found.uses.includes(use))found.uses.push(use);resources.set(raw,found);}
const skills=readTable('Client6.0/settings/skills.txt'),missiles=readTable('Client6.0/settings/missles.txt');
const template='Client6.0/settings/skilltemplate.txt';
for(const [key,s]of Object.entries(readIni(template))){if(s.Type?.trim()!=='IndexList'||!s.Value)continue;enums[key]=s.Value.trim().split(/[\/|]/).filter(x=>x.trim()).map((x,i)=>({value:String(i),label:C.decode(x),description:C.decode(s.StaticName||key)+' · '+C.decode(x),source:template+' ['+key+']'}));}
const missileTemplate='Client6.0/settings/missletemplate.txt',mt=readIni(missileTemplate);
const movement=['Đứng tại chỗ','Bay thẳng','Bay ngẫu nhiên','Bay vòng tròn','Xoắn ốc Archimedes','Đuổi theo mục tiêu','Theo động tác nhân vật','Đường parabol','Hồi chuyển'];
enums.MoveKind=mt.MoveKind.Value.split('|').map((raw,i)=>({value:raw.includes(',')?raw.split(',')[1]:String(i),label:movement[i],description:movement[i]+'; quỹ đạo còn phụ thuộc Param1/2/3 và Lua.',source:missileTemplate+' [MoveKind]',rawLabel:new TextDecoder('gbk').decode(Buffer.from(raw,'latin1'))}));
enums.FollowKind=['Không bám','Bám NPC','Bám đạn cha'].map((label,i)=>({value:String(i),label,description:label+' theo FollowKind.',source:missileTemplate+' [FollowKind]'}));
// Template boolean wording is inconsistent between skill/missile files. Expose the numeric flag explicitly.
const flags='IsPhysical IsAura NeedShadow BaseSkill IsMelee TargetOnly TargetEnemy TargetAlly TargetObj ByMissle IsUseAR StartEvent FlyEvent CollideEvent VanishedEvent TargetSelf TargetOther TargetNoNpc PeaceCanUse ClientSend WeaponSkill IsExpSkill ShowAddition ShowEvent StopWhenMove HeelAtParent IsRangeDmg LoopPlay SubLoop CanDestroy ColVanish CanSlow CanColFriend AutoExplode MultiShow ColFollowTarget'.split(' ');
for(const key of flags)enums[key]=[0,1].map(n=>({value:String(n),label:n?'Bật':'Tắt',description:'Cờ '+key+' = '+n+'. '+(n?'Cho phép / kích hoạt thuộc tính.':'Không kích hoạt thuộc tính.'),source:'Cờ số trong bảng client; cần đối chiếu engine với giá trị ngoài 0/1.'}));
for(const [key,rows]of Object.entries(enums)){const table=missiles.headers.includes(key)&&!skills.headers.includes(key)?missiles:skills;for(const value of new Set(table.rows.map(r=>r.raw[key]).filter(v=>v!==undefined&&v!=='')))if(!rows.some(r=>r.value===value))rows.push({value,label:'Giá trị nguồn chưa có nhãn',description:'Template client chưa giải thích mã '+value+'. Giữ nguyên mã, chưa suy nghĩa.',source:table===skills?'skills.txt':'missles.txt'});}
const actionSource='Client6.0/settings/npcres/npc¶¯×÷±í.txt',at=readTable(actionSource);
const actionNames=['Đứng chiến đấu','Đứng thường 1','Đứng thường 2','Đi trong chiến đấu','Đi thường','Chạy trong chiến đấu','Chạy thường','Bị thương','Ngã / chết','Tấn công 1','Tấn công 2','Thi triển phép / chưởng','Ngồi','Khinh công'];
const actions=at.rows.map((r,i)=>({value:String(i),label:actionNames[i]||r.raw.NpcAction,code:r.raw.NpcAction,description:(actionNames[i]||r.raw.NpcAction)+'; SPR cụ thể đổi theo giới tính và tư thế vũ khí.',source:actionSource+':'+r.line+' (thứ tự từ 0; chưa đối chiếu binary)'}));
const users14=skills.rows.filter(r=>r.raw.CharAnimId==='14');
actions.push({value:'14',label:'Không có dòng action tương ứng',code:null,description:'Bảng NpcAction chỉ có 0–13. Mã 14 xuất hiện ở '+users14.length+' dòng skill, gồm Thiếu Lâm Côn pháp. Khả năng là mã không phát động tác; chưa xác minh engine. Không gán một SPR khác làm preview.',source:actionSource+' + skills.txt'});enums.CharAnimId=actions;
const characterSource='Client6.0/settings/npcres/ÈËÎïÀàÐÍ.txt',characters=readTable(characterSource).rows.slice(0,2),profiles=[];
for(const row of characters){const c=row.raw,base='Client6.0/settings/npcres/',mapSource=base+c.WeaponActionTab1,mapping=readTable(mapSource),body=readTable(base+c.Body).rows[0].raw,head=readTable(base+c.Head).rows[0].raw;
 const profile={key:c.CharacterName,label:c.CharacterName==='MainMan'?'Nam · thân chuẩn 001':'Nữ · thân chuẩn 001',source:characterSource+':'+row.line,poses:[]};
 for(let i=0;i<mapping.rows.length;i++){const r=mapping.rows[i],pose={value:String(i),label:C.decode(r.raw.EqType),source:mapSource+':'+r.line,actions:{}};
  for(const a of actions.filter(a=>a.code)){const mapped=r.raw[a.code],column=mapped==='JumpFly'?'Jump':mapped,file=body[column];if(file){const raw='\\'+c.ResFilePath+'\\'+file;const headPath=head[column]?'\\'+c.ResFilePath+'\\'+head[column]:null;pose.actions[a.value]={path:raw,headPath,mapped,column};if(headPath)add(headPath,'Action '+a.value+' / đầu chuẩn / '+profile.label);add(raw,'Action '+a.value+' / '+profile.label+' / '+pose.label);}}
  profile.poses.push(pose);
 }profiles.push(profile);
}
for(const r of skills.rows){add(r.raw.PreCastSpr,'PreCastSpr #'+r.raw.SkillId+' '+C.decode(r.raw.SkillName));}
for(const r of missiles.rows)for(const [key,raw]of Object.entries(r.raw))if(/^AnimFileB?\d$/.test(key))add(raw,key+' · missile #'+r.raw.MissleId+' '+C.decode(r.raw.MissleName));
const stateSource='Client6.0/settings/npcres/×´Ì¬Í¼ÐÎ¶ÔÕÕ±í.txt',st=readTable(stateSource);
const states=st.rows.map(r=>({value:r.raw.Status.replace(/^Status/,''),label:r.raw.Status+' · '+r.raw[st.headers[2]],path:r.raw[st.headers[1]],description:'Vị trí '+r.raw[st.headers[2]]+' · chế độ '+r.raw[st.headers[3]],source:stateSource+':'+r.line}));
for(const s of states)add(s.path,s.label);enums.StateSpecialId=[{value:'0',label:'Không có trạng thái',description:'Không chọn StateSpecialId.'},...states];
for(const field of ['HorseLimit','RelativePosType','StatePriority'])enums[field]=[...new Set(skills.rows.map(r=>r.raw[field]).filter(v=>v!==undefined))].sort().map(value=>({value,label:value===''?'Chưa khai báo':'Giá trị trong client',description:'Giữ mã '+value+' của '+field+'; chưa có bảng enum đủ tin cậy để gán nghĩa.',source:'Client6.0/settings/skills.txt'}));
const packs=Object.entries(readIni('Client6.0/package.ini').Package).filter(([k])=>/^\d+$/.test(k)).map(([,v])=>v);
const reader=new PakReader(path.join(C.root,'Client6.0'),packs),catalog=[];let bytes=0;
fs.mkdirSync(path.join(out,'demo/animations'),{recursive:true});
for(const item of resources.values()){
 const key=crypto.createHash('sha256').update(Buffer.from(item.path,'latin1')).digest('hex').slice(0,24);let result={...item,key};
 try{const found=reader.extract(item.path),spr=Spr.decode(found.data),gzip=zlib.gzipSync(found.data),file='animations/'+key+'.js';
  fs.writeFileSync(path.join(out,'demo',file),'window.JX_ANIMATION_BYTES=window.JX_ANIMATION_BYTES||{};window.JX_ANIMATION_BYTES['+JSON.stringify(key)+']='+JSON.stringify(gzip.toString('base64'))+';\n');bytes+=gzip.length;
  result={...result,status:'ready',file,container:found.container,candidates:found.candidates,entryId:found.entryId,hashPath:found.hashPath,entryOffset:found.offset,sha256:crypto.createHash('sha256').update(found.data).digest('hex'),bytes:found.data.length,frames:spr.frames,directions:spr.directions,interval:spr.interval,bounds:spr.bounds,warning:spr.warning};
 }catch(e){result.status='unavailable';result.reason=e.message;}
 catalog.push(result);
}
reader.close();
const files=[...sources].map(p=>({path:p,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(C.root,p))).digest('hex')}));
const policy='Snapshot: ưu tiên loose, sau đó PAK đầu tiên trong package.ini. Chưa xác minh thứ tự engine đang chạy; giữ danh sách mọi PAK ứng viên.';
const report={generatedAt:new Date().toISOString(),policy,files,packErrors:reader.errors,total:catalog.length,ready:catalog.filter(x=>x.status==='ready').length,gzipBytes:bytes,unavailable:catalog.filter(x=>x.status!=='ready').map(x=>({path:x.path,reason:x.reason})),directionWarnings:catalog.filter(r=>r.warning).map(r=>({path:r.path,warning:r.warning})),action14:{count:users14.length,meaning:'Not mapped by NpcAction table; no-animation inference unverified'}};
fs.writeFileSync(path.join(out,'demo/choices.js'),'window.JX_CHOICES='+JSON.stringify({enums,actions,profiles,states,resources:catalog,policy})+';\n');
fs.writeFileSync(path.join(out,'evidence/resource-inventory.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({total:report.total,ready:report.ready,gzipBytes:bytes,unavailable:report.unavailable.slice(0,8),errors:reader.errors},null,2));
