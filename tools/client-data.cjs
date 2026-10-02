const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
// Reuse the project's explicit TCVN3 table; never decode names as UTF-8/GBK.
const converter=fs.readFileSync(path.join(root,'Simcity/tcvn3.py'),'utf8');
function array(name){const block=converter.match(new RegExp(name+' = \\[([\\s\\S]*?)\\]'))[1];return [...block.matchAll(/u"([^"]*)"/g)].map(m=>m[1]);}
const a=array('TCVN3'),b=array('UNICODE');
const pairs=a.map((s,i)=>[s,b[i]]).sort((x,y)=>y[0].length-x[0].length);
const replacements=new Map(pairs);
const pattern=new RegExp(pairs.map(([s])=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
function decode(text){return text.replace(pattern,s=>replacements.get(s)).replace(/\0/g,'').trim();}
function read(relative){return fs.readFileSync(path.join(root,relative)).toString('latin1');}
function table(relative){const lines=read(relative).split(/\r?\n/);const headers=lines[0].split('\t');return {headers,rows:lines.slice(1).flatMap((line,index)=>{if(!line.trim())return [];const cells=line.split('\t');return [{line:index+2,raw:Object.fromEntries(headers.map((h,i)=>[h,cells[i]??'']))}];})};}
function ini(relative){const sections={};let section='';for(const line of read(relative).split(/\r?\n/)){const s=/^\[([^\]]+)\]/.exec(line);if(s){section=s[1];sections[section]={};continue;}const m=/^([^;=]+)=(.*)$/.exec(line);if(m&&sections[section])sections[section][m[1].trim()]=m[2];}return sections;}
// Token positions preserve original byte offsets (Latin-1 = one character per byte).
function luaTables(source){
  const tokens=[];const re=/--\[\[[\s\S]*?\]\]|--[^\r\n]*|\[\[[\s\S]*?\]\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_][A-Za-z_0-9]*|\d+(?:\.\d+)?|[^\s]/g;let m;
  while((m=re.exec(source))){if(m[0].startsWith('--'))continue;tokens.push({v:m[0],p:m.index});}
  const pairs=new Map(),stack=[];tokens.forEach((t,i)=>{if(t.v==='{')stack.push(i);if(t.v==='}'&&stack.length)pairs.set(stack.pop(),i);});
  function fields(start){const end=pairs.get(start),result={};if(end===undefined)return result;for(let i=start+1;i<end;){if(tokens[i+1]?.v==='='&&tokens[i+2]?.v==='{'){const close=pairs.get(i+2);if(close===undefined)break;const key=tokens[i].v;const begin=tokens[i+2].p,finish=tokens[close].p+1;result[key]={start:i+2,raw:source.slice(begin,finish),byteStart:begin,byteEnd:finish,line:source.slice(0,begin).split('\n').length,duplicates:(result[key]?.duplicates||0)+(result[key]?1:0)};i=close+1;}else if(tokens[i].v==='{'&&pairs.has(i)){i=pairs.get(i)+1;}else i++;}return result;}
  const start=tokens.findIndex((t,i)=>t.v==='SKILLS'&&tokens[i+1]?.v==='='&&tokens[i+2]?.v==='{');if(start<0)return {};
  return Object.fromEntries(Object.entries(fields(start+2)).map(([key,entry])=>[key,Object.fromEntries(Object.entries(fields(entry.start)).map(([name,value])=>[name,{raw:value.raw,line:value.line,byteStart:value.byteStart,byteEnd:value.byteEnd,duplicates:value.duplicates}]))]));
}
module.exports={root,decode,read,table,ini,luaTables,encoding:{unicode:b,tcvn3:a,source:'Simcity/tcvn3.py'}};
