const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const files=require('./release-files.cjs').sourceFiles(root).filter(p=>path.basename(p)!=='SHA256SUMS.txt');
const sums=files.map(p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')+'  '+path.relative(root,p).replace(/\\/g,'/'));
fs.writeFileSync(path.join(root,'SHA256SUMS.txt'),sums.join('\n')+'\n');console.log('Checksums: '+files.length+' files');
