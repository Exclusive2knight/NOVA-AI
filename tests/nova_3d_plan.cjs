/* AI-driven 3D starter planning validated without Cloudflare credits. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const worker=fs.readFileSync(path.join(__dirname,'..','cloudflare/NOVA_3_Phone_Deploy_Worker.js'),'utf8');
const backend=worker.slice(worker.indexOf('// NOVA 3 — Cloudflare Worker.'));
const entry=new Function(backend.replace('export default {','const WorkerEntry = {')+'\nreturn WorkerEntry;')();
const calls=[];
const example={parts:[
 {name:'Painted hood',shape:'box',material:'paint',translation:[0,1,-1.2],scale:[1.8,.4,1.4]},
 {name:'Windshield',shape:'box',material:'glass',translation:[0,1.7,-.2],scale:[1.65,.3,.1]},
 {name:'Tire',shape:'cylinder',material:'tire',translation:[-.9,.4,-1.4],scale:[.7,.23,.7]},
 {name:'Garbage script',shape:'script',material:'paint',translation:[0,0,0],scale:[1,1,1]},
 {name:'Invalid position',shape:'box',material:'paint',translation:[999,0,0],scale:[1,1,1]}
]};
const env={NOVA_PASSCODE:'demo-owner-secret',AI:{async run(model,params){calls.push({model,params});return {response:JSON.stringify(example)}}}};
function request(prompt='A modern off-road luxury SUV',pass='demo-owner-secret',origin='https://exclusive2knight.github.io'){
 return new Request('https://nova-ai.example.workers.dev/api/3d-plan',{method:'POST',
 headers:{Origin:origin,'X-NOVA-Passcode':pass,'Content-Type':'application/json'},
 body:JSON.stringify({prompt,kind:'vehicle'})});
}
async function main(){
 let result=await entry.fetch(request(),env);
 assert.equal(result.status,200);const data=await result.json();
 assert.equal(data.parts.length,3,'Filter invalid AI-generated primitives');
 assert.equal(calls.length,1);
 assert(calls[0].params.messages[0].content.includes('ONLY primitive meshes'));
 assert(calls[0].params.messages[0].content.includes('materials'));
 result=await entry.fetch(request('An off road SUV','wrong-secret'),env);
 assert.equal(result.status,401);
 result=await entry.fetch(request('A car','demo-owner-secret','https://evil.example'),env);
 assert.equal(result.status,403);
 result=await entry.fetch(request(''),env);assert.equal(result.status,400);
 result=await entry.fetch(request('A fancy SUV'),{NOVA_PASSCODE:env.NOVA_PASSCODE});
 assert.equal(result.status,503);
 assert.equal(calls.length,1,'No AI quota consumed for denied requests');
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 assert(html.includes('id="novaGLBAI"'));
 assert(html.includes("apiEndpoint('/api/3d-plan')"));
 assert(html.includes('NOVA3D.buildFromPlan(prompt,data,options)'));
 console.log('NOVA Pro 3D plan: authenticated, bounded custom primitive layout, secure offline fallback and studio integration PASSED');
}
main().catch(e=>{console.error(e);process.exitCode=1});
