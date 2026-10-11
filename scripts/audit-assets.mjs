import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve('client/public');
const files=[];
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())scan(p);else files.push(p);}}
scan(root);const report=[];const failures=[];
for(const file of files){
 const bytes=fs.readFileSync(file),relative=path.relative(root,file).replaceAll('\\','/');
 let format='ok',clips=[];
 if(bytes.subarray(0,100).toString().startsWith('version https://git-lfs.github.com/spec')){format='LFS pointer';failures.push(relative);}
 if(file.endsWith('.glb')){
  if(bytes.length<20||bytes.toString('utf8',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length){format='invalid GLB';failures.push(relative);}
  else {try{const doc=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));clips=(doc.animations??[]).map(a=>a.name);for(const resource of [...(doc.buffers??[]),...(doc.images??[])])if(resource.uri&&!resource.uri.startsWith('data:')&&!fs.existsSync(path.join(path.dirname(file),resource.uri))){failures.push(relative+': missing '+resource.uri);}}catch(e){format='invalid JSON chunk';failures.push(relative);}}
 }
 let dir=path.dirname(file),notice='';
 while(dir.startsWith(root)){const found=fs.readdirSync(dir).find(n=>/^(LICENSE|CREDITS|ATTRIBUTION)/i.test(n));if(found){notice=path.relative(root,path.join(dir,found)).replaceAll('\\','/');break;}if(dir===root)break;dir=path.dirname(dir);}
 report.push({path:relative,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),format,animationClips:clips,upstreamNotice:notice,rightsStatus:notice?'upstream-notice-present; official-source-review-required':'source-review-required'});
}
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/asset-inventory.json',JSON.stringify(report,null,2)+'\n');
const summary={files:report.length,bytes:report.reduce((n,f)=>n+f.bytes,0),glbs:report.filter(f=>f.path.endsWith('.glb')).length,failures};
fs.writeFileSync('docs/asset-audit-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));if(failures.length)process.exitCode=1;
