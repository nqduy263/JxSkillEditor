const fs=require('fs'),path=require('path');
const excluded=new Set(['.packages','.build-home','.http-cache','.downloads','.runtime','releases','bin','obj','native-test-data','.git','Data']);
function sourceFiles(root){
 function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  if(excluded.has(e.name)||e.isSymbolicLink())return [];
  const full=path.join(dir,e.name);return e.isDirectory()?walk(full):[full];
 });}return walk(root).filter(p=>!p.endsWith('.zip')).sort();
}
module.exports={sourceFiles};
