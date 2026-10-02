(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.JXSpr=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function decode(bytes){
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(b.length<32||String.fromCharCode(...b.slice(0,3))!=='SPR')throw Error('Không phải SPR');
  const u16=p=>v.getUint16(p,true),i16=p=>v.getInt16(p,true),u32=p=>v.getUint32(p,true);
  const meta={width:u16(4),height:u16(6),centerX:i16(8),centerY:i16(10),frames:u16(12),colors:u16(14),directions:u16(16),interval:u16(18)};
  if(!meta.frames||meta.frames>8192||meta.colors>256)throw Error('Header SPR vượt giới hạn');
  const base=32+meta.colors*3,tableSize=meta.frames*8;let table=-1;
  for(let shift=0;shift<=8;shift++){const t=base+shift*8,s=t+tableSize;if(s>b.length)break;let valid=true;for(let i=0;i<meta.frames;i++){const off=u32(t+i*8),len=u32(t+i*8+4);if(len<8||s+off+len>b.length){valid=false;break;}const w=u16(s+off),h=u16(s+off+2);if(w>2048||h>2048||w*h>4e6){valid=false;break;}}if(valid){table=t;break;}}
  if(table<0)throw Error('Bảng frame SPR không hợp lệ / chưa hỗ trợ');
  const frames=[];let pixels=0,minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(let i=0;i<meta.frames;i++){
   const start=table+tableSize+u32(table+i*8),end=start+u32(table+i*8+4),w=u16(start),h=u16(start+2),x=i16(start+4),y=i16(start+6);
   pixels+=w*h;if(pixels>64e6)throw Error('SPR vượt bộ nhớ preview');
   const rgba=new Uint8ClampedArray(w*h*4);let p=start+8,alphaMax=0;
   for(let row=0;row<h;row++){let col=0;while(col<w){if(p+2>end)throw Error('RLE thiếu dữ liệu');const count=b[p++],alpha=b[p++];if(!count||col+count>w)throw Error('RLE vượt hàng');alphaMax=Math.max(alphaMax,alpha);if(alpha){if(p+count>end)throw Error('RLE thiếu palette index');for(let k=0;k<count;k++){const idx=b[p++];if(idx>=meta.colors)throw Error('Palette index ngoài bảng');const out=(row*w+col+k)*4;rgba[out]=b[32+idx*3];rgba[out+1]=b[33+idx*3];rgba[out+2]=b[34+idx*3];rgba[out+3]=alpha;}}col+=count;}}
   if(alphaMax<=32)for(let a=3;a<rgba.length;a+=4)rgba[a]=Math.min(255,Math.round(rgba[a]*255/32));
   if(w&&h){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x+w);maxY=Math.max(maxY,y+h);}frames.push({width:w,height:h,x,y,rgba});
  }
  if(!Number.isFinite(minX)){minX=0;minY=0;maxX=meta.width;maxY=meta.height;}
  const directions=meta.directions||1,directionGroupsValid=meta.frames%directions===0;
  return {...meta,directions,directionGroupsValid,previewDirections:directionGroupsValid?directions:1,framesPerDirection:directionGroupsValid?meta.frames/directions:meta.frames,warning:directionGroupsValid?'':'Số frame không chia hết số hướng trong header; đang xem toàn bộ frame gốc, chưa tách hướng.',bounds:{x:minX,y:minY,width:maxX-minX,height:maxY-minY},images:frames};
 }
 function frameIndex(spr,direction,frame){const per=spr.framesPerDirection||spr.frames;return Math.min(spr.frames-1,Math.max(0,Math.min((spr.previewDirections||spr.directions)-1,direction))*per+Math.max(0,frame)%per);}
 return {decode,frameIndex};
});
