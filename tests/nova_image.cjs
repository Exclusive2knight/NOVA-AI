/* NOVA FLUX image generation auth and validation (mock Cloudflare; no credits). */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const worker=fs.readFileSync(path.join(__dirname,'..','cloudflare/NOVA_3_Phone_Deploy_Worker.js'),'utf8');
const backend=worker.slice(worker.indexOf('// NOVA 3 — Cloudflare Worker.'));
const entry=new Function(backend.replace('export default {','const handler = {')+'\nreturn handler;')();
const calls=[];
const env={NOVA_PASSCODE:'example-secure-passcode',AI:{
 async run(model,options){calls.push({model,options});return {image:Buffer.from('fake-image-'.repeat(30)).toString('base64')}}
}};
function request(body,pass='example-secure-passcode',origin='https://exclusive2knight.github.io'){
 return new Request('https://nova-ai.example.workers.dev/api/image',{method:'POST',
 headers:{'Content-Type':'application/json','X-NOVA-Passcode':pass,'Origin':origin},
 body:JSON.stringify(body)});
}
async function main(){
 let r=await entry.fetch(request({prompt:'A modern blue SUV in a mountain garage',style:'game',ratio:'wide'}),env);
 assert.equal(r.status,200);
 const result=await r.json();
 assert(result.image.startsWith('data:image/jpeg;base64,'));
 assert.equal(result.model,'FLUX.1 schnell');
 assert.equal(calls.length,1);
 assert.equal(calls[0].model,'@cf/black-forest-labs/flux-1-schnell');
 assert(calls[0].options.prompt.includes('game asset'));
 assert(calls[0].options.prompt.includes('Wide landscape'));
 assert.equal(calls[0].options.steps,4);
 r=await entry.fetch(request({prompt:''}),env);assert.equal(r.status,400);
 r=await entry.fetch(request({prompt:'Draw a car'},'wrong-passcode'),env);assert.equal(r.status,401);
 r=await entry.fetch(request({prompt:'Draw a car'},'example-secure-passcode','https://other.example'),env);assert.equal(r.status,403);
 r=await entry.fetch(request({prompt:'Draw a car'}),{NOVA_PASSCODE:env.NOVA_PASSCODE});assert.equal(r.status,503);
 r=await entry.fetch(request({prompt:'a'.repeat(2700)}),env);assert.equal(r.status,400);
 assert.equal(calls.length,1,'Denied and invalid requests must not spend provider quota');
 console.log('NOVA image generation: FLUX request, styling, limits, owner auth, CORS and quota protection PASSED');
}
main().catch(error=>{console.error(error);process.exitCode=1});
