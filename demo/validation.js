(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./model.js'):root.JXModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.JXValidation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
 'use strict';
 const textColumns=new Set(['SkillName','Property','SkillDesc','Param1Memo','Param2Memo','MissleName']);
 const pathColumn=k=>/Spr$|Snd$|Script$|SkillIcon|^AnimFile|^SndFile/.test(k);
 const formulaKey=f=>JSON.stringify([f.script,f.key,f.property]);
 const normalizePath=p=>String(p||'').replace(/\//g,'\\').toLowerCase();
 function validate(data,choices,state){
  const skills=new Map(data.skills.map(s=>[s.id,s])),missiles=new Map(data.missiles.map(m=>[m.id,m]));
  for(const s of state.skills)skills.set(s.id,s);for(const m of state.missiles)missiles.set(m.id,m);
  const formulas=new Map(state.formulas.map(f=>[formulaKey(f),f])),resources=new Map(choices.resources.map(r=>[normalizePath(r.path),r]));
  const issues=[],keys=new Set(),roots=new Set(state.skills.map(s=>s.id)),checkedSkills=new Set(),checkedMissiles=new Set();
  function add(severity,code,kind,id,field,message){const key=[code,kind,id,field,code==='cycle'?'':message].join('|');if(keys.has(key))return;keys.add(key);if(issues.length<1500)issues.push({severity,code,kind,id,field,message});}
  const checkText=(r,kind)=>{
   const base=(kind==='skill'?data.skills:data.missiles).find(x=>x.id===r.id),f=r.fields;
   for(const [key,value]of Object.entries(f)){
    if(base?.fields[key]===value&&!r.isNew)continue;
    if(/[\x00-\x1f\x7f]/.test(value))add('error','tsv-control',kind,r.id,key,'Có tab/ký tự điều khiển hoặc xuống dòng. Dùng <enter> cho mô tả.');
    if(textColumns.has(key)){
     const allowed=new Set(data.encoding?.unicode||[]);
     if([...value.normalize('NFC')].some(c=>c.codePointAt(0)>127&&!allowed.has(c)))add('error','encoding',kind,r.id,key,'Có ký tự ngoài bảng TCVN3 đã đối chiếu.');
     if(value!==value.normalize('NFC'))add('warning','normalization',kind,r.id,key,'Chữ có dấu tách rời; cần chuẩn hóa NFC trước khi chuyển TCVN3.');
    }else if(pathColumn(key)){
     if([...value].some(c=>c.codePointAt(0)>255))add('error','path-encoding',kind,r.id,key,'Đường dẫn có Unicode ngoài Latin-1; cần byte GBK/Mojibake tương ứng.');
     if(/(^|[\\/])\.\.([\\/]|$)|^[a-z]+:|[\x00-\x1f]/i.test(value))add('error','path-relative',kind,r.id,key,'Đường dẫn game phải nằm trong cây tài nguyên, không có .. hoặc ổ đĩa/URL.');
    }else if(!/^LvlSetting\d+$|^LvlData\d+$/.test(key)&&value!==''&&(!/^-?\d+$/.test(value)||!Number.isSafeInteger(Number(value))))add('error','integer',kind,r.id,key,'Cột số cần số nguyên hữu hạn. Giới hạn engine chưa xác minh.');
   }
  };
  function asset(r,kind,key){const raw=r.fields[key];if(!raw)return;const resource=resources.get(normalizePath(raw));
   if(key==='SkillIcon'){
    const match=data.skills.find(s=>s.fields.SkillIcon===raw&&s.icon);
    if(match){if(match.icon.match!=='Tên tài nguyên SkillIcon')add('warning','icon-unverified',kind,r.id,key,'PNG đang ghép theo ID, chưa đối chiếu SPR gốc.');return;}
   }
   if(!resource||resource.status!=='ready')add('warning','asset-missing',kind,r.id,key,resource?.reason||'Tài nguyên chưa có trong snapshot, chưa preview/xác minh được.');
  }
  function skillRecord(s){if(checkedSkills.has(s.id))return;checkedSkills.add(s.id);checkText(s,'skill');const f=s.fields;
   if(data.duplicates.some(d=>d.id===s.id))add('error','source-duplicate','skill',s.id,'SkillId','ID trùng nhiều dòng trong nguồn. Phải chọn chính xác dòng trước khi xuất patch.');
   for(const key of ['SkillName','MaxLevel','SkillStyle','CharClass'])if(s.isNew&&!f[key]?.trim())add('error','required','skill',s.id,key,'Skill mới chưa khai báo '+key+'.');
   if(s.isNew&&!f.CharAnimId)add('warning','action-empty','skill',s.id,'CharAnimId','Chưa chọn action. Skill bị động cũng cần đối chiếu mã không phát action.');
   if(f.MaxLevel&&Number(f.MaxLevel)<1)add('error','max-level','skill',s.id,'MaxLevel','Cấp tối đa phải từ 1.');
   if(Number(f.MaxLevel)>1000)add('warning','level-cap','skill',s.id,'MaxLevel','Chỉ kiểm tra công thức/liên kết tại cấp 1–1000.');
   const action=choices.actions.find(a=>a.value===f.CharAnimId);
   if(f.CharAnimId&&!action?.code)add('warning','action-unmapped','skill',s.id,'CharAnimId',action?.description||'Action chưa có trong bảng client.');
   for(const [key,options]of Object.entries(choices.enums))if(f[key]!==undefined&&f[key]!==''&&!options.some(o=>o.value===f[key]))add('warning','enum-unknown','skill',s.id,key,'Mã '+f[key]+' chưa có nhãn trong profile.');
   if(s.isNew){add('warning','learning','skill',s.id,'SkillId','ID mới cần kiểm tra giới hạn engine và thêm lệnh học/hiển thị môn phái.');if(!f.SkillIcon)add('warning','icon-empty','skill',s.id,'SkillIcon','Chưa chọn icon SPR.');}
   for(const key of ['SkillIcon','PreCastSpr'])asset(s,'skill',key);
   for(const slot of M.slots(f).filter(t=>t.property||t.key)){
    if(!/^[_A-Za-z][_A-Za-z0-9]*$/.test(slot.property)||!/^[_A-Za-z][_A-Za-z0-9]*$/.test(slot.key)){add('error','slot-key','skill',s.id,'LvlSetting'+slot.slot,'Cặp thuộc tính/khóa Lua chưa hợp lệ.');continue;}
    const script=data.scripts[f.LvlSetScript],draft=formulas.get(JSON.stringify([f.LvlSetScript,slot.key,slot.property])),def=script?.tables?.[slot.key]?.[slot.property],raw=draft?.after??def?.raw;
    if(!raw)add('error','formula-missing','skill',s.id,'LvlSetting'+slot.slot,'Chưa có bảng '+slot.key+' / '+slot.property+' trong script hoặc draft.');
    else if(script&&script.evaluator!=='floor-link')add('warning','evaluator','skill',s.id,'LvlSetScript','Script có evaluator chưa hỗ trợ; giá trị theo cấp chưa kiểm tra được.');
    else{const result=M.evaluate(raw,1);if(result.unknown||result.values?.some(v=>!Number.isFinite(v)))add(draft?'error':'warning','formula-literal','skill',s.id,'LvlSetting'+slot.slot,result.unknown||'Bảng Lua cho giá trị không hữu hạn.');}
   }
  }
  function missileRecord(m){if(checkedMissiles.has(m.id))return;checkedMissiles.add(m.id);checkText(m,'missile');
   if(m.isNew&&!m.fields.LifeTime)add('error','required','missile',m.id,'LifeTime','Đường đạn mới cần thời gian tồn tại.');
   for(const key of data.missileHeaders.filter(k=>k.startsWith('AnimFile')))asset(m,'missile',key);
  }
  for(const f of state.formulas){for(const s of skills.values())if(s.fields.LvlSetScript===f.script&&M.slots(s.fields).some(t=>t.key===f.key&&t.property===f.property))roots.add(s.id);
   const result=M.evaluate(f.after,1);if(result.unknown||result.values?.some(v=>!Number.isFinite(v)))add('error','formula-draft','formula',null,f.property,result.unknown||'Công thức cho giá trị không hữu hạn.');
  }
  const changedMissiles=new Set(state.missiles.map(m=>m.id));
  for(const s of skills.values())if(M.childTarget(s.fields)?.kind==='missile'&&changedMissiles.has(Number(s.fields.ChildSkillId)))roots.add(s.id);
  for(const a of state.assets){roots.add(a.skillId);add('warning','spr-conversion','skill',a.skillId,'SkillIcon','Ảnh thử PNG/JPEG chưa chuyển thành SPR và chưa thay tài nguyên game.');}
  function linksAt(s,level){const links=M.links(s.fields);for(const slot of M.slots(s.fields).filter(t=>/^skill_(start|fly|collide|vanished)event$/.test(t.property))){
   const script=data.scripts[s.fields.LvlSetScript];if(script&&script.evaluator!=='floor-link')continue;
   const draft=formulas.get(JSON.stringify([s.fields.LvlSetScript,slot.key,slot.property])),def=script?.tables?.[slot.key]?.[slot.property];
   const result=M.evaluate(draft?.after??def?.raw??'',level);
   if(result.values?.[2]>0)links.push({id:result.values[2],kind:'skill',field:'LvlSetting'+slot.slot,enabled:result.values[0]!==0});
  }return links;}
  function walk(kind,id,level,path,depth,done=new Set()){const key=kind+':'+id,record=(kind==='skill'?skills:missiles).get(id);if(!record)return;
   if(path.has(key)){add('error','cycle',kind,id,kind==='skill'?'ChildSkillId':'ResponseSkill','Có vòng lặp liên kết đang bật (phát hiện ở cấp '+level+').');return;}
   if(depth>=32){add('warning','depth',kind,id,'ChildSkillId','Chuỗi vượt 32 tầng; cần kiểm tra engine.');return;}
   if(done.has(key))return;
   if(kind==='skill')skillRecord(record);else missileRecord(record);
   const next=new Set(path);next.add(key);
   const links=kind==='skill'?linksAt(record,level):Number(record.fields.ResponseSkill)>0?[{id:Number(record.fields.ResponseSkill),kind:'skill',field:'ResponseSkill',enabled:true}]:[];
   for(const link of links){const target=(link.kind==='skill'?skills:missiles).get(link.id);
    if(!target){add(link.enabled?'error':'warning','reference',kind,id,link.field,'Thiếu '+link.kind+' #'+link.id+(link.enabled?'':' (sự kiện đang tắt)')+'.');continue;}
    if(link.enabled)walk(link.kind,link.id,level,next,depth+1,done);
   }
   done.add(key);
  }
  // Per-level graph traversal catches event IDs that change with the Lua curve.
  for(const root of roots){const s=skills.get(root);if(!s)continue;skillRecord(s);const cap=Math.min(1000,Math.max(1,Number(s.fields.MaxLevel)||20));for(let level=1;level<=cap;level++)walk('skill',root,level,new Set(),0);}
  for(const m of state.missiles)walk('missile',m.id,1,new Set(),0);
  const errors=issues.filter(i=>i.severity==='error').length,warnings=issues.length-errors;
  return {checkedAt:new Date().toISOString(),errors,warnings,issues,checkedSkills:checkedSkills.size,checkedMissiles:checkedMissiles.size,truncated:keys.size>1500,deployable:false,scope:'Draft và các tham chiếu bật, cấp 1 đến MaxLevel (tối đa 1000); profile liên kết chưa đối chiếu engine.'};
 }
 return {validate};
});
