(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./model.js'):root.JXModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.JXWorkspace=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
 'use strict';
 const FORMAT='jx-skill-studio-workspace/v1',MAX_BYTES=32*1024*1024,clone=o=>JSON.parse(JSON.stringify(o));
 const formulaKey=f=>JSON.stringify([f.script,f.key,f.property]);
 const fail=message=>{throw Error(message);};
 function safeTree(value,depth=0){
  if(depth>32)fail('Dữ liệu lồng quá sâu.');
  if(value&&typeof value==='object')for(const key of Object.keys(value)){
   if(['__proto__','prototype','constructor'].includes(key))fail('Khóa dữ liệu không được hỗ trợ: '+key);
   safeTree(value[key],depth+1);
  }
 }
 function parse(value){
  const text=typeof value==='string'?value:JSON.stringify(value);
  if(new TextEncoder().encode(text).length>MAX_BYTES)fail('Workspace vượt 32 MB.');
  const parsed=JSON.parse(text);safeTree(parsed);return parsed;
 }
 function string(value,name,max=65536){if(typeof value!=='string'||value.length>max)fail(name+' phải là chuỗi, tối đa '+max+' ký tự.');return value;}
 function id(value){if(!Number.isSafeInteger(value)||value<=0)fail('ID phải là số nguyên dương.');return value;}
 function fields(raw,headers,idKey,recordId){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==headers.length)fail('Thiếu hoặc dư cột '+idKey+' #'+recordId);
  const out={};for(const key of headers){if(!Object.hasOwn(raw,key))fail('Thiếu cột '+key);out[key]=string(raw[key],key);}
  if(out[idKey]!==String(recordId))fail('ID khai báo khác '+idKey);return out;
 }
 function pack(data,state){
  return {format:FORMAT,snapshotId:data.snapshotId,savedAt:new Date().toISOString(),
   skills:state.skills.map(s=>({id:s.id,isNew:!!s.isNew,faction:s.faction,fields:clone(s.fields)})),
   missiles:state.missiles.map(m=>({id:m.id,isNew:!!m.isNew,fields:clone(m.fields)})),
   formulas:clone(state.formulas),assets:clone(state.assets),selection:state.selection,settings:clone(state.settings||{})};
 }
 function unpack(input,data){
  const doc=parse(input);if(doc.format==='jx-skill-studio-draft/v0.4'){if(!doc.workspace)fail('Changeset thiếu workspace.');return unpack(doc.workspace,data);}const legacy=doc.format==='jx-skill-studio-draft/v0.3';
  if(doc.format!==FORMAT&&!legacy)fail('Chỉ mở workspace v1 hoặc changeset v0.3.');
  if(!legacy&&(!data.snapshotId||doc.snapshotId!==data.snapshotId))fail('Snapshot không trùng. Giữ nguyên bản đang mở; cần chuyển đổi theo nguồn tương ứng.');
  if(legacy&&doc.source!==data.source)fail('Changeset v0.3 thuộc nguồn khác.');
  for(const key of ['skills','missiles','formulas','assets'])if(!Array.isArray(doc[key])||doc[key].length>10000)fail('Danh sách không hợp lệ: '+key);
  const bases={skill:new Map(data.skills.map(s=>[s.id,s])),missile:new Map(data.missiles.map(s=>[s.id,s]))};
  function records(list,kind){
   const seen=new Set(),headers=kind==='skill'?data.headers:data.missileHeaders,idKey=kind==='skill'?'SkillId':'MissleId';
   return list.map(r=>{
    id(r.id);if(seen.has(r.id))fail('Trùng '+kind+' #'+r.id);seen.add(r.id);
    if(typeof r.isNew!=='boolean')fail('Thiếu isNew cho #'+r.id);
    const base=bases[kind].get(r.id);if(r.isNew?!!base:!base)fail('Xung đột ID '+kind+' #'+r.id);
    let values;
    if(legacy&&!r.isNew){
     values=clone(base.fields);if(!Array.isArray(r.fields)||r.fields.length>headers.length)fail('Diff không hợp lệ.');const seenFields=new Set();
     for(const d of r.fields){if(!headers.includes(d.field)||seenFields.has(d.field))fail('Cột diff lạ/trùng.');seenFields.add(d.field);
      if(d.before!==base.fields[d.field])fail('Nguồn đã đổi: #'+r.id+' / '+d.field);
      values[d.field]=string(d.after,d.field);
     }
    }else values=legacy?r.draft:r.fields;
    values=fields(values,headers,idKey,r.id);
    if(r.isNew&&!values[kind==='skill'?'SkillName':'MissleName'].trim())fail('Thiếu tên #'+r.id);
    const faction=kind==='skill'?(r.faction||''):'';
    if(r.isNew&&kind==='skill'&&faction&&!data.factions.some(f=>f.key===faction))fail('Môn phái chưa có trong snapshot.');
    const record=r.isNew?(kind==='skill'?M.newSkill(data,{id:r.id,name:values.SkillName,faction}):M.newMissile(data,r.id,values.MissleName)):clone(base);
    record.fields=values;return record;
   });
  }
  const skills=records(doc.skills,'skill'),missiles=records(doc.missiles,'missile');
  const all=new Map(data.skills.map(s=>[s.id,s]));for(const s of skills)all.set(s.id,s);
  const seenFormulas=new Set(),identifier=/^[_A-Za-z][_A-Za-z0-9]*$/;
  const formulas=doc.formulas.map(f=>{
   string(f.script,'Đường dẫn Lua',1024);string(f.key,'Khóa Lua',256);string(f.property,'Thuộc tính Lua',256);string(f.after,'Bảng Lua');
   if(!identifier.test(f.key)||!identifier.test(f.property))fail('Khóa Lua không hợp lệ.');
   const identity=formulaKey(f);if(seenFormulas.has(identity))fail('Trùng công thức.');seenFormulas.add(identity);
   const source=data.scripts[f.script],base=source?.tables?.[f.key]?.[f.property];
   if(typeof f.isNew!=='boolean'||(f.isNew?!!base:!base))fail('Công thức thay đổi loại tạo/sửa.');
   if((source?.sha256??null)!==f.sourceHash)fail('Hash script không trùng: '+f.script);
   if(base&&(f.before!==base.raw||f.byteStart!==base.byteStart||f.byteEnd!==base.byteEnd))fail('Vị trí hoặc nội dung công thức đã đổi.');
   if(!base&&(f.before!==null||f.byteStart!==null||f.byteEnd!==null))fail('Công thức mới có nguồn trước không hợp lệ.');
   // Never execute Lua from a file. Unsupported text stays editable and is reported by the validator.
   const users=[...all.values()].filter(s=>s.fields.LvlSetScript===f.script&&M.slots(s.fields).some(t=>t.key===f.key&&t.property===f.property)).map(s=>s.id);
   return {isNew:f.isNew,source:source?.path||f.script,script:f.script,key:f.key,property:f.property,line:base?.line??null,byteStart:base?.byteStart??null,byteEnd:base?.byteEnd??null,sourceHash:source?.sha256??null,before:base?.raw??null,after:f.after,users};
  });
  const seenAssets=new Set(),assets=doc.assets.map(a=>{
   id(a.skillId);if(!all.has(a.skillId)||seenAssets.has(a.skillId))fail('ID ảnh thiếu hoặc trùng.');seenAssets.add(a.skillId);
   string(a.name,'Tên ảnh',255);string(a.preview,'Ảnh',2800000);
   if(!['image/png','image/jpeg'].includes(a.mime)||!new RegExp('^data:'+a.mime+';base64,[A-Za-z0-9+/]+={0,2}$').test(a.preview))fail('Chỉ nhận ảnh PNG/JPEG base64.');
   const raw=atob(a.preview.split(',')[1]);if(raw.length>2*1024*1024)fail('Ảnh lớn hơn 2 MB.');
   if(a.mime==='image/png'?raw.slice(0,8)!=='\x89PNG\r\n\x1a\n':!raw.startsWith('\xff\xd8\xff'))fail('Chữ ký ảnh không khớp định dạng.');
   return {skillId:a.skillId,name:a.name,mime:a.mime,preview:a.preview,requiresSprConversion:true};
  });
  const v=doc.settings||{},settings={theme:v.theme==='bronze'?'bronze':'jade',level:Math.max(1,Math.min(1000,Number(v.level)||20)),query:typeof v.query==='string'?v.query.slice(0,256):'',faction:data.factions.some(f=>f.key===v.faction)?v.faction:'',scope:['learned','script','other',''].includes(v.scope)?v.scope:'learned',tab:['general','combat','damage','layers','missile','assets','raw','diff'].includes(v.tab)?v.tab:'general'};
  return {skills,missiles,formulas,assets,selection:all.has(doc.selection)?doc.selection:skills[0]?.id||4,settings,legacy};
 }
 // Coalesce edits, serialize writes, and make flush wait for the latest revision.
 function autosaver(write,capture,onState=()=>{}){
  let ready=false,revision=0,saved=0,timer=null,running=null;
  async function flush(){
   clearTimeout(timer);timer=null;if(!ready)throw Error('Tự lưu chưa sẵn sàng. Hãy lưu workspace ra tệp.');
   if(running){await running;if(saved<revision)return flush();return;}
   if(saved===revision)return;
   const task=(async()=>{while(saved<revision){const target=revision,payload=capture();onState('saving');await write(payload);saved=target;}onState('saved');})();
   running=task;try{await task;}catch(e){onState('error',e);throw e;}finally{running=null;}
  }
  function changed(){if(!ready)return;revision++;onState('dirty');clearTimeout(timer);timer=setTimeout(()=>flush().catch(()=>{}),650);}
  return {enable(){ready=true;},disable(){ready=false;clearTimeout(timer);},changed,flush,get dirty(){return revision>saved;},get ready(){return ready;}};
 }
 return {FORMAT,MAX_BYTES,formulaKey,parse,pack,unpack,autosaver};
});
