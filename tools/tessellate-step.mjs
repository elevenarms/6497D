import occtimportjs from 'occt-import-js';
import fs from 'fs';
const occt = await occtimportjs();
const buf = fs.readFileSync(process.argv[2]);
const t0=Date.now();
const r = occt.ReadStepFile(new Uint8Array(buf), {linearUnit:'millimeter', linearDeflectionType:'bounding_box_ratio', linearDeflection:0.0008, angularDeflection:0.35});
console.log('ok',r.success,'meshes',r.meshes.length,'ms',Date.now()-t0);
function walk(n,d){ console.log(' '.repeat(d*2)+n.name+' meshes='+JSON.stringify(n.meshes)); (n.children||[]).forEach(c=>walk(c,d+1)); }
walk(r.root,0);
let tris=0; r.meshes.forEach((m,i)=>{tris+=m.index.array.length/3;});
console.log('tris',tris);
r.meshes.forEach((m,i)=>{ const p=m.attributes.position.array; let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9]; for(let k=0;k<p.length;k+=3)for(let j=0;j<3;j++){mn[j]=Math.min(mn[j],p[k+j]);mx[j]=Math.max(mx[j],p[k+j]);} console.log(i,m.name,m.color, mn.map(v=>v.toFixed(2)).join(','),'|',mx.map(v=>v.toFixed(2)).join(','), m.index.array.length/3);});
fs.writeFileSync('result.json', JSON.stringify({root:r.root, meshes:r.meshes.map(m=>({name:m.name,color:m.color,pos:Array.from(m.attributes.position.array),nrm:m.attributes.normal?Array.from(m.attributes.normal.array):null,idx:Array.from(m.index.array)}))}));
