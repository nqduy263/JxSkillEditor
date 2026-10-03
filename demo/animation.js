(() => {
 'use strict';
 const manifest=new Map(window.JX_CHOICES.resources.map(r=>[r.path,r])),loads=new Map();
 async function load(raw){
  const r=manifest.get(raw);if(!r)throw Error('Tài nguyên chưa có trong snapshot: '+(raw||'(rỗng)'));if(r.status!=='ready')throw Error(r.reason);
  if(!loads.has(r.key))loads.set(r.key,(async()=>{
   if(!window.JX_ANIMATION_BYTES?.[r.key])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=r.file;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Không tải được '+r.file+'; cần giữ thư mục animations cạnh index.html.'));};document.head.append(script);});
   if(typeof DecompressionStream==='undefined')throw Error('Preview cần Edge/Chrome có hỗ trợ DecompressionStream.');
   const bytes=Uint8Array.from(atob(window.JX_ANIMATION_BYTES[r.key]),c=>c.charCodeAt(0));
   const rawBytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
   return {meta:r,spr:window.JXSpr.decode(rawBytes)};
  })().catch(e=>{loads.delete(r.key);throw e;}));
  const data=await loads.get(r.key);while(loads.size>3){const first=loads.keys().next().value;if(first===r.key)break;loads.delete(first);delete window.JX_ANIMATION_BYTES?.[first];}return data;
 }
 function player(host){
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  host.classList.add('animation-player');const title=el('strong','Preview animation'),canvas=el('canvas'),message=el('p','Chọn action hoặc SPR để xem frame thực.'),meta=el('small'),bar=el('div'),play=el('button','▶ Phát'),direction=el('select'),speed=el('select'),scrub=el('input'),counter=el('small');
  canvas.width=360;canvas.height=260;canvas.setAttribute('aria-label','Preview frame SPR');play.type='button';play.className='button';bar.className='animation-toolbar';message.className='animation-message';meta.className='animation-meta';scrub.type='range';scrub.min=0;scrub.value=0;scrub.max=0;scrub.setAttribute('aria-label','Frame');direction.setAttribute('aria-label','Hướng animation');speed.setAttribute('aria-label','Tốc độ xem');
  for(const rate of [.25,.5,1,2]){const o=el('option',rate+'×');o.value=rate;speed.append(o);}speed.value='1';bar.append(play,direction,speed);host.append(title,canvas,message,bar,scrub,counter,meta);
  let loaded=null,frame=0,dir=0,playing=false,raf=null,last=0,serial=0,frameCanvases=[],intervalOverride=0;
  function stop(){playing=false;play.textContent='▶ Phát';if(raf!==null)cancelAnimationFrame(raf);raf=null;}
  function draw(){if(!loaded)return;const s=loaded.spr,index=window.JXSpr.frameIndex(s,dir,frame),img=s.images[index],ctx=canvas.getContext('2d');if(!ctx)return;
   ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#09120f';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#22372d';ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}for(let y=0;y<canvas.height;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
   const layers=[loaded,...(loaded.companions||[])],overlays=loaded.overlays||[],allLayers=[...layers,...overlays],minX=Math.min(...layers.map(l=>l.spr.bounds.x-l.spr.centerX)),minY=Math.min(...layers.map(l=>l.spr.bounds.y-l.spr.centerY)),maxX=Math.max(...layers.map(l=>l.spr.bounds.x+l.spr.bounds.width-l.spr.centerX)),maxY=Math.max(...layers.map(l=>l.spr.bounds.y+l.spr.bounds.height-l.spr.centerY));
   const width=maxX-minX,height=maxY-minY,overlayWidth=Math.max(...overlays.map(l=>l.spr.bounds.width),0),overlayHeight=Math.max(...overlays.map(l=>l.spr.bounds.height),0),castScene=loaded.layout==='cast',zoom=Math.min((canvas.width-24)/Math.max(1,width),(canvas.height-24)/Math.max(1,height),3),sceneZoom=castScene?Math.min(2.2,(canvas.width*.82)/Math.max(1,width,overlayWidth),(canvas.height*.82)/Math.max(1,height,overlayHeight)):zoom,ox=(canvas.width-width*zoom)/2-minX*zoom,oy=(canvas.height-height*zoom)/2-minY*zoom;
   const characterAnchor={x:canvas.width*.78,y:canvas.height*.78},effectAnchor={x:canvas.width*.42,y:canvas.height*.48};
   ctx.imageSmoothingEnabled=false;const drawLayer=(layer,k,alpha=1,anchor=null)=>{const sprite=layer.spr,idx=window.JXSpr.frameIndex(sprite,dir,frame),part=sprite.images[idx];let cached=frameCanvases[k];if(!cached||cached.index!==idx){const surface=document.createElement('canvas');surface.width=part.width||1;surface.height=part.height||1;if(part.width&&part.height)surface.getContext('2d').putImageData(new ImageData(part.rgba,part.width,part.height),0,0);cached={index:idx,canvas:surface};frameCanvases[k]=cached;}const z=anchor?sceneZoom:zoom,ax=anchor?anchor.x:ox,ay=anchor?anchor.y:oy,visualCx=anchor?(sprite.bounds.x+sprite.bounds.width/2):sprite.centerX,visualCy=anchor?(sprite.bounds.y+sprite.bounds.height/2):sprite.centerY;ctx.globalAlpha=alpha;ctx.drawImage(cached.canvas,ax+(part.x-visualCx)*z,ay+(part.y-visualCy)*z,part.width*z,part.height*z);};if(castScene){overlays.forEach((layer,k)=>drawLayer(layer,layers.length+k,.78,effectAnchor));layers.forEach((layer,k)=>drawLayer(layer,k,1,characterAnchor));}else{layers.forEach((layer,k)=>drawLayer(layer,k));overlays.forEach((layer,k)=>drawLayer(layer,layers.length+k,1));}ctx.globalAlpha=1;
   ctx.fillStyle='#d5b670';ctx.fillRect(ox-3,oy,7,1);ctx.fillRect(ox,oy-3,1,7);
   scrub.value=String(frame);counter.textContent='Frame '+(frame+1)+' / '+s.framesPerDirection+' · hướng '+dir+' · ảnh #'+index;
  }
  function tick(time){if(!playing||!loaded)return;if(time-last>=Math.max(16,(intervalOverride||loaded.spr.interval||100)/Number(speed.value))){frame=(frame+1)%Math.max(1,loaded.spr.framesPerDirection);draw();last=time;}raf=requestAnimationFrame(tick);}
  play.onclick=()=>{if(!loaded)return;if(playing)stop();else{playing=true;play.textContent='Ⅱ Dừng';last=0;raf=requestAnimationFrame(tick);}};
  direction.onchange=()=>{dir=Number(direction.value);frame=0;draw();};scrub.oninput=()=>{stop();frame=Number(scrub.value);draw();};
  async function show(raw,label,{companions=[],overlays=[],intervalMs=0,autoplayDelayMs=0,layout='standard'}={}){const token=++serial;stop();loaded=null;frame=0;dir=0;intervalOverride=Number(intervalMs)>0?Math.max(16,Number(intervalMs)):0;frameCanvases=[];host.classList.toggle('cast-scene',layout==='cast');canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);title.textContent=label||'Preview SPR';message.textContent='Đang giải mã…';meta.textContent='';counter.textContent='';play.disabled=true;scrub.disabled=true;direction.replaceChildren();
   try{const [main,...parts]=await Promise.all([load(raw),...companions.filter(Boolean).map(load)]),overlayParts=await Promise.all(overlays.filter(Boolean).map(load));const data={...main,companions:parts,overlays:overlayParts,layout};if(token!==serial)return;loaded=data;const s=data.spr;message.textContent=s.warning||'Frame SPR thật · interval theo header hoặc giá trị xem thử.';meta.textContent=data.meta.path+' · '+data.meta.container+(parts.length?' + lớp nhân vật':'')+(overlayParts.length?' + effect cast trong cảnh':'')+(layout==='cast'?' · mô phỏng cảnh thi triển':'')+' · '+s.frames+' frame / '+s.directions+' hướng. '+(data.meta.candidates.length>1?'Có '+data.meta.candidates.length+' PAK ứng viên.':'');for(let i=0;i<s.previewDirections;i++){const o=el('option',s.directionGroupsValid?'Hướng '+i:'Frame gốc');o.value=i;direction.append(o);}direction.value='0';scrub.max=Math.max(0,s.framesPerDirection-1);scrub.disabled=false;play.disabled=false;draw();if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){if(autoplayDelayMs>0){message.textContent='Chờ cast '+Math.round(autoplayDelayMs)+' ms · '+message.textContent;setTimeout(()=>{if(token===serial&&loaded&&!playing)play.onclick();},Math.min(60000,autoplayDelayMs));}else play.onclick();}}
   catch(e){if(token!==serial)return;message.textContent=e.message;}
  }
  function explain(text,label){serial++;stop();loaded=null;title.textContent=label||'Preview animation';message.textContent=text;meta.textContent='';counter.textContent='';play.disabled=true;scrub.disabled=true;direction.replaceChildren();canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);}
  function setIntervalMs(value){intervalOverride=Number(value)>0?Math.max(16,Number(value)):0;last=0;}
  return {show,explain,stop,setIntervalMs};
 }
 window.JXAnimation={player,load};
})();
