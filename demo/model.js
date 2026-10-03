(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.JXModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function parseLiteral(source){
  const clean=source.replace(/--\[\[[\s\S]*?\]\]/g,'').replace(/--[^\r\n]*/g,'');
  const tokens=clean.match(/-?\d+(?:\.\d+)?|[A-Za-z_][A-Za-z_0-9]*|[^\s]/g)||[];let p=0;
  function take(v){if(tokens[p++]!==v)throw Error('Cần '+v);}
  function value(){if(tokens[p]==='{')return table();const t=tokens[p++];if(/^-?\d+(?:\.\d+)?$/.test(t))return Number(t);if(t==='Line')return t;throw Error('Chỉ hỗ trợ bảng số và Line; biểu thức/hàm chưa được đánh giá');}
  function table(){take('{');const result={};let index=1;while(tokens[p]!=='}'){if(p>=tokens.length)throw Error('Thiếu dấu }');let key=index++;if(tokens[p]==='['){p++;key=Number(tokens[p++]);if(!Number.isInteger(key)||key<1)throw Error('Index không hợp lệ');take(']');take('=');index--;}
   result[key]=value();if(tokens[p]===','||tokens[p]===';')p++;else if(tokens[p]!=='}')throw Error('Thiếu dấu phẩy');}p++;return result;}
  const result=value();if(p!==tokens.length)throw Error('Có biểu thức ngoài bảng');return result;
 }
 function link(level,points){const entries=Object.keys(points).map(Number).sort((a,b)=>a-b);if(entries.some((x,i)=>x!==i+1))throw Error('Bảng mốc cấp không liên tục');if(entries.length<2)return -1;
  const rows=entries.map(k=>points[k]);if(rows.some(row=>!row||typeof row[1]!=='number'||typeof row[2]!=='number'||Object.keys(row).some(k=>!['1','2','3'].includes(k))||row[3]&&row[3]!=='Line'))throw Error('Mốc không phải Line số');
  for(let i=1;i<rows.length;i++)if(rows[i][1]<rows[i-1][1])throw Error('Mốc cấp giảm');
  let a,b;if(level<rows[0][1]){a=rows[0];b=rows[1];}else if(level>rows.at(-1)[1]){a=rows.at(-2);b=rows.at(-1);}else{const i=rows.findIndex((row,i)=>i>0&&level>=rows[i-1][1]&&level<=row[1]);if(i<1)throw Error('Không tìm thấy đoạn');a=rows[i-1];b=rows[i];}
  return a[1]===b[1]?b[2]:(b[2]-a[2])*(level-a[1])/(b[1]-a[1])+a[2];
 }
 function evaluate(raw,level){try{const table=parseLiteral(raw);if(typeof table!=='object'||Object.keys(table).some(k=>!['1','2','3'].includes(k)))throw Error('Cần bảng ba tham số');return {values:[1,2,3].map(k=>table[k]===undefined?0:Math.floor(link(level,table[k]))),method:'floor(Link), bảng số; chưa đối chiếu engine'};}catch(error){return {unknown:error.message};}}
 const statLabels={physicsenhance_p:'Sát thương vật lý ngoại công (%)',addphysicsdamage_p:'Cộng sát thương vật lý (%)',physicsdamage_v:'Sát thương vật lý (điểm)',colddamage_v:'Băng sát (điểm)',coldmagic_v:'Băng sát nội công',firedamage_v:'Hỏa sát (điểm)',firemagic_v:'Hỏa sát nội công',lightingdamage_v:'Lôi sát (điểm)',lightingmagic_v:'Lôi sát nội công',poisondamage_v:'Độc sát (điểm)',poisonmagic_v:'Độc sát nội công',attackratingenhance_p:'Độ chính xác (%)',deadlystrikeenhance_p:'Chí mạng (%)',skill_cost_v:'Tiêu hao',skill_attackradius:'Tầm đánh',missle_speed_v:'Tốc độ đạn',missle_lifetime_v:'Thời gian tồn tại đạn',missle_num:'Số đạn',missle_num_v:'Số đạn',skill_startevent:'Tầng khi xuất chiêu',skill_flyevent:'Tầng khi đạn bay',skill_collideevent:'Tầng khi va chạm',skill_vanishedevent:'Tầng khi tan biến',skill_eventskilllevel:'Cấp tầng sự kiện',seriesdamage_p:'Sát thương ngũ hành (%)'};
 function slots(fields){return Array.from({length:20},(_,i)=>({slot:i+1,property:fields['LvlSetting'+(i+1)]||'',key:fields['LvlData'+(i+1)]||''}));}
 function propertyDefinition(data,fields,property,key){const script=data.scripts[fields.LvlSetScript];return {script,definition:script?.tables?.[key]?.[property]};}
 function childTarget(fields){const id=Number(fields.ChildSkillId);return id>0?{id,kind:fields.BaseSkill==='1'||fields.ByMissle==='1'?'missile':'skill',field:'ChildSkillId'}:null;}
 function links(fields){const list=[];for(const [flag,id,label] of [['StartEvent','StartSkillId','Xuất chiêu'],['FlyEvent','FlySkillId','Đạn bay'],['CollideEvent','CollidSkillId','Va chạm'],['VanishedEvent','VanishedSkillId','Tan biến']])if(Number(fields[id])>0)list.push({id:Number(fields[id]),kind:'skill',field:id,label,enabled:Number(fields[flag])!==0});const child=childTarget(fields);if(child)list.push({...child,label:child.kind==='missile'?'Mẫu đường đạn':'Chiêu con',enabled:true});return list;}
 function filterSkills(skills,filters){const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();const q=normalize(filters.query||'');return skills.filter(s=>(!filters.faction||s.faction===filters.faction)&&(!filters.scope||s.scope===filters.scope)&&(!q||normalize(s.fields.SkillName).includes(q)||String(s.id).includes(q)));}
 function diff(before,after){return Object.keys(after).filter(k=>before[k]!==after[k]).map(field=>({field,before:before[field]??'',after:after[field]}));}
 function nextDraftId(ids,start=1){const used=new Set((ids||[]).map(Number).filter(id=>Number.isSafeInteger(id)&&id>0));let id=Number.isSafeInteger(start)&&start>0?start:1;while(used.has(id)){if(id===Number.MAX_SAFE_INTEGER)throw Error('Không còn ID draft an toàn trong miền số');id++;}return id;}
 function newSkill(data,{id,name,faction=''}){
  if(!Number.isSafeInteger(id)||id<=0||!name.trim())throw Error('ID dương và tên skill là bắt buộc');
  const fields=Object.fromEntries(data.headers.map(k=>[k,'']));
  // Explicit empty draft. Never derive defaults/references from a selected skill.
  Object.assign(fields,{SkillId:String(id),SkillName:name.trim(),ReqLevel:'1',MaxLevel:'20',EqtLimit:'-2',CharClass:'0',CharAnimId:'',BaseSkill:'0',ByMissle:'0',ChildSkillId:'0',ChildSkillNum:'0',StartEvent:'0',StartSkillId:'0',FlyEvent:'0',FlySkillId:'0',CollideEvent:'0',CollidSkillId:'0',VanishedEvent:'0',VanishedSkillId:'0',StateSpecialId:'0',LvlSetScript:'\\script\\skill\\custom_'+id+'.lua'});
  const f=data.factions.find(f=>f.key===faction);return {id,line:null,fields,faction,factionName:f?.name||'Chưa phân phái',scope:'new',isNew:true,learn:null,icon:null,factionEvidence:'Môn phái do người tạo chọn; chưa có lệnh học',script:fields.LvlSetScript};
 }
 function newMissile(data,id,name){if(!Number.isSafeInteger(id)||id<=0||!name.trim())throw Error('ID dương và tên đường đạn là bắt buộc');return {id,line:null,isNew:true,fields:Object.assign(Object.fromEntries(data.missileHeaders.map(k=>[k,''])),{MissleId:String(id),MissleName:name.trim(),MoveKind:'0',FollowKind:'0',Speed:'0',LifeTime:'1',LoopPlay:'0',IsRangeDmg:'0'})};}
 return {parseLiteral,link,evaluate,slots,statLabels,propertyDefinition,childTarget,links,filterSkills,diff,nextDraftId,newSkill,newMissile};
});
