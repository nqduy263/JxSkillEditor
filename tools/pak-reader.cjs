// Read-only adapter ported from the workspace's PakEngine.cs. No archive writes.
const fs=require('fs'),path=require('path');
function fileId(raw){const bytes=Buffer.from(raw.replace(/\//g,'\\'),'latin1');let id=0;for(let i=0;i<bytes.length;i++){let c=bytes[i];if(c>=65&&c<=90)c+=32;else if(c>=128)c-=256;id=(id+(i+1)*c)>>>0;id=Math.imul(id%0x8000000b,0xffffffef)>>>0;}return (id^0x12345678)>>>0;}
function ucl(src,size){if(size<0||size>64*1024*1024)throw Error('UCL size limit');const out=Buffer.alloc(size);let ip=0,op=0,bb=0,last=1,budget=(src.length+size)*32;
 const byte=()=>{if(ip>=src.length)throw Error('UCL input overrun');return src[ip++];};
 const bit=()=>{if(--budget<0)throw Error('UCL budget');bb=(bb&0x7f)?bb*2:byte()*2+1;return (bb>>>8)&1;};
 while(true){while(bit()){if(op>=size)throw Error('UCL output overrun');out[op++]=byte();}let off=1;do{off=off*2+bit();if(off>0x1000002)throw Error('UCL offset');}while(!bit());if(off===2)off=last;else{off=(off-3)*256+byte();if(off===0xffffffff)break;off++;last=off;}let len=bit()*2+bit();if(!len){len=1;do{len=len*2+bit();if(len>=size)throw Error('UCL length');}while(!bit());len+=2;}if(off>0xd00)len++;len++;if(off>op||op+len>size)throw Error('UCL copy bounds');let pos=op-off;for(let i=0;i<len;i++)out[op++]=out[pos++];}
 if(op!==size)throw Error('UCL size mismatch');return out;
}
function frameSpr(raw){
 if(raw.length<32)throw Error('Frame SPR truncated');
 if(raw.toString('ascii',0,3)!=='SPR'){
  const count=raw.readUInt32LE(0),size=raw.readUInt32LE(4);if(count>0&&count<=4096&&size<=64*1024*1024&&8+count*12<=raw.length){const chunks=[];for(let i=0;i<count;i++){const p=8+i*12,off=raw.readUInt32LE(p),len=raw.readUInt32LE(p+4),flag=raw.readUInt32LE(p+8),stored=(flag&0xffffff)||len;if(off+stored>raw.length)throw Error('Fragment bounds');const buf=raw.subarray(off,off+stored);chunks.push(flag>>>24?ucl(buf,len):buf);}raw=Buffer.concat(chunks);if(raw.length!==size)throw Error('Fragment size');}
 }
 // Standard offset tables are accepted first, before interpreting compressed sizes.
 const Spr=require('../demo/spr.js');try{Spr.decode(raw);return raw;}catch{}
 if(raw.toString('ascii',0,3)!=='SPR')throw Error('Unsupported frame container');
 const n=raw.readUInt16LE(12),colors=raw.readUInt16LE(14),base=32+colors*3,table=Buffer.alloc(n*8);let ptr=base+table.length,total=0;const frames=[];
 if(!n||ptr>raw.length)throw Error('Frame table bounds');
 for(let i=0;i<n;i++){const a=raw.readUInt32LE(base+i*8),b=raw.readUInt32LE(base+i*8+4),stored=Math.min(a,b),size=Math.max(a,b);if(ptr+stored>raw.length)throw Error('Frame payload bounds');const frame=stored<size?ucl(raw.subarray(ptr,ptr+stored),size):raw.subarray(ptr,ptr+stored);ptr+=stored;table.writeUInt32LE(total,i*8);table.writeUInt32LE(frame.length,i*8+4);total+=frame.length;frames.push(frame);}
 return Buffer.concat([raw.subarray(0,base),table,...frames]);
}
class PakReader{
 constructor(client,packNames){this.client=client;this.packs=[];this.errors=[];for(const name of packNames){const full=path.join(client,'data',name);if(!fs.existsSync(full))continue;let fd;try{fd=fs.openSync(full,'r');const head=Buffer.alloc(16);fs.readSync(fd,head,0,16,0);if(head.toString('ascii',0,4)!=='PACK')throw Error('Unsupported PACK signature');const count=head.readUInt32LE(4),off=head.readUInt32LE(8),size=fs.fstatSync(fd).size;if(count>2e6||off+count*16>size)throw Error('Index bounds');const index=Buffer.alloc(count*16);fs.readSync(fd,index,0,index.length,off);const entries=new Map();for(let i=0;i<count;i++){const p=i*16;entries.set(index.readUInt32LE(p),{offset:index.readUInt32LE(p+4),size:index.readUInt32LE(p+8),flag:index.readUInt32LE(p+12)});}this.packs.push({name,fd,size,entries});}catch(e){if(fd!==undefined)fs.closeSync(fd);this.errors.push({name,error:e.message});}}}
 extract(raw){const relative=raw.replace(/^[\\/]+/,'').replace(/\\/g,path.sep),full=path.resolve(this.client,relative);if(!full.startsWith(path.resolve(this.client)+path.sep))throw Error('Asset outside client');let hashPath=raw,id=fileId(raw),matches=this.packs.filter(p=>p.entries.has(id));if(!matches.length&&!raw.startsWith('\\')){hashPath='\\'+raw;id=fileId(hashPath);matches=this.packs.filter(p=>p.entries.has(id));}if(fs.existsSync(full)&&fs.statSync(full).isFile())return {data:fs.readFileSync(full),container:'loose',candidates:matches.map(p=>p.name)};if(!matches.length)throw Error('Không tìm thấy SPR ở loose hoặc PAK đã đọc');const pak=matches[0],e=pak.entries.get(id),compressed=(e.flag&0xffffff)!==e.size,stored=(e.flag&0xffffff)||e.size;if(e.size>64*1024*1024||stored>64*1024*1024||e.offset+stored>pak.size)throw Error('PAK entry bounds');let data=Buffer.alloc(stored);fs.readSync(pak.fd,data,0,stored,e.offset);if(e.flag&0x10000000)data=frameSpr(data);else if(compressed){const method=e.flag>>>24;if(![1,4,32].includes(method))throw Error('Compression chưa hỗ trợ: '+method);data=ucl(data,e.size);}return {data,container:pak.name,candidates:matches.map(p=>p.name),entryId:id,hashPath,offset:e.offset};}
 close(){for(const p of this.packs)fs.closeSync(p.fd);}
}
module.exports={fileId,ucl,frameSpr,PakReader};
