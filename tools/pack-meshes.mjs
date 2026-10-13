// Pack tessellated STEP meshes into a compact binary: Uint16 quantized positions, Int8 normals, Uint16/32 indices.
import fs from 'fs';
const r = JSON.parse(fs.readFileSync('result.json','utf8'));
// part name per mesh from the assembly tree
const owner = [], node = []; let nid = 0;
(function walk(n){ const id = nid++; (n.meshes||[]).forEach(i=>{owner[i]=n.name; node[i]=id;}); (n.children||[]).forEach(walk); })(r.root);
let mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
for (const m of r.meshes) for (let k=0;k<m.pos.length;k+=3) for(let j=0;j<3;j++){mn[j]=Math.min(mn[j],m.pos[k+j]);mx[j]=Math.max(mx[j],m.pos[k+j]);}
const chunks=[]; let off=0; const meshes=[];
const push=(ta)=>{ const pad=(4-(off%4))%4; if(pad){chunks.push(Buffer.alloc(pad)); off+=pad;} const b=Buffer.from(ta.buffer,ta.byteOffset,ta.byteLength); chunks.push(b); const o=off; off+=b.length; return o; };
let totalV=0;
r.meshes.forEach((m,i)=>{
  const n=m.pos.length/3; totalV+=n;
  const q=new Uint16Array(n*3);
  for(let k=0;k<n*3;k++){const j=k%3; q[k]=Math.round((m.pos[k]-mn[j])/(mx[j]-mn[j])*65535);}
  const nr=new Int8Array(n*4);
  for(let k=0;k<n;k++){ for(let j=0;j<3;j++) nr[k*4+j]=Math.round((m.nrm?m.nrm[k*3+j]:0)*127); }
  const idx = n<65536 ? new Uint16Array(m.idx) : new Uint32Array(m.idx);
  let bmn=[1e9,1e9,1e9],bmx=[-1e9,-1e9,-1e9];
  for(let k=0;k<n*3;k+=3)for(let j=0;j<3;j++){bmn[j]=Math.min(bmn[j],m.pos[k+j]);bmx[j]=Math.max(bmx[j],m.pos[k+j]);}
  meshes.push({i, part:owner[i], node:node[i], v:n, pOff:push(q), nOff:push(nr), iOff:push(idx), iCount:m.idx.length, i32:n>=65536,
    min:bmn.map(v=>+v.toFixed(3)), max:bmx.map(v=>+v.toFixed(3))});
});
fs.writeFileSync(process.argv[2]+'/movement.bin', Buffer.concat(chunks));
fs.writeFileSync(process.argv[2]+'/movement.json', JSON.stringify({bboxMin:mn,bboxMax:mx,meshes}));
console.log('verts',totalV,'bytes',off);
