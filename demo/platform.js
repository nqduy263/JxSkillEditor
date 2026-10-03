(function(root){
 'use strict';
 const native=!!root.chrome?.webview,pending=new Map(),updateListeners=new Set();let serial=0,dbPromise,closing=()=>{},ownsLock=false;
 function call(action,payload){return new Promise((resolve,reject)=>{const id='jx'+(++serial),timeout=setTimeout(()=>{pending.delete(id);reject(Error('Hết thời gian chờ '+action));},action==='workspace.open'||action==='workspace.saveAs'||action==='draft.export'||action==='host.checkForUpdates'?600000:15000);pending.set(id,{resolve,reject,timeout});root.chrome.webview.postMessage({id,action,payload});});}
 if(native)root.chrome.webview.addEventListener('message',e=>{const m=e.data;if(m?.event==='host.closing'){closing();return;}if(typeof m?.event==='string'&&m.event.startsWith('host.update')){updateListeners.forEach(fn=>{try{fn(m.event,m.data)}catch(_){}});return;}const p=pending.get(m?.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timeout);m.ok?p.resolve(m.result):p.reject(Error(m.error||'Thao tác thất bại.'));});
 function database(){
  if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{if(!root.indexedDB){reject(Error('Trình duyệt không có IndexedDB. Dùng Lưu workspace.'));return;}const r=root.indexedDB.open('jx-skill-studio-v04',1);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Kho dữ liệu đang bị một tab khác giữ.'));});return dbPromise;
 }
 async function browserLock(){
  if(!root.navigator?.locks)throw Error('Không khóa được workspace trong trình duyệt này. Dùng Lưu/Mở workspace hoặc bản EXE.');
  await new Promise((resolve,reject)=>{root.navigator.locks.request('jx-skill-studio-autosave',{ifAvailable:true},lock=>{if(!lock){reject(Error('Một tab khác đang tự lưu. Tab này chỉ lưu qua nút Lưu workspace.'));return;}ownsLock=true;resolve();return new Promise(()=>{});}).catch(reject);});
 }
 async function readAutosave(){
  if(native)return call('workspace.readAutosave');if(!ownsLock)await browserLock();const db=await database();
  return new Promise((resolve,reject)=>{const t=db.transaction('workspace','readonly'),r=t.objectStore('workspace').get('current');r.onsuccess=()=>resolve({workspace:r.result||null});r.onerror=()=>reject(r.error);});
 }
 async function writeAutosave(payload){
  if(native)return call('workspace.writeAutosave',payload);if(!ownsLock)throw Error('Tab này không có quyền tự lưu.');const db=await database();
  return new Promise((resolve,reject)=>{const t=db.transaction('workspace','readwrite'),s=t.objectStore('workspace'),read=s.get('current');read.onsuccess=()=>{if(read.result)s.put(read.result,'previous');s.put(payload,'current');};t.oncomplete=()=>resolve({savedAt:new Date().toISOString()});t.onabort=()=>reject(t.error||Error('Không tự lưu được.'));t.onerror=()=>reject(t.error);});
 }
 function download(payload,name){const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);return {canceled:false,downloaded:true};}
 function openFile(){
  if(native)return call('workspace.open');return new Promise((resolve,reject)=>{const input=document.createElement('input');input.type='file';input.accept='.jxworkspace,.json';input.oncancel=()=>resolve({canceled:true});input.onchange=async()=>{try{const file=input.files[0];if(!file){resolve({canceled:true});return;}if(file.size>32*1024*1024)throw Error('Tệp vượt 32 MB.');resolve({workspace:await file.text(),path:file.name});}catch(e){reject(e);}};input.click();});
 }
 root.JXPlatform={native,info:()=>native?call('host.info'):Promise.resolve({mode:'Demo trình duyệt',version:'0.6.2'}),readAutosave,writeAutosave,openFile,
  saveAs:payload=>native?call('workspace.saveAs',payload):Promise.resolve(download(payload,'SkillWorkspace.jxworkspace')),
  exportDraft:payload=>native?call('draft.export',payload):Promise.resolve(download(payload,'jx-skill-draft-v04.json')),
  scan:()=>native?call('discovery.scan'):Promise.reject(Error('Quét tiến trình/WSL có trong bản Windows EXE.')),
  checkForUpdates:()=>native?call('host.checkForUpdates'):Promise.resolve({available:false,status:'browser-demo',version:'0.6.2'}),
  onUpdate:fn=>{if(typeof fn==='function')updateListeners.add(fn);return()=>updateListeners.delete(fn);},
  onClosing:fn=>{closing=fn;},closeReady:()=>native?call('host.closeReady'):Promise.resolve(),closeFailed:()=>native?call('host.closeFailed'):Promise.resolve()
 };
})(window);
