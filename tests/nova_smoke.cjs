/* NOVA frontend/backend static smoke checks — no API keys or paid model calls */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(root,'cloudflare','NOVA_3_Phone_Deploy_Worker.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const config=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
assert(inline,'NOVA inline application script missing');
new vm.Script(inline[1],{filename:'nova-app.js'});
assert(manifest.name.includes('NOVA'),'Missing NOVA PWA manifest');
assert(html.includes('id="memoryOpen"'),'Cloud memory should be visibly accessible from chat even on a phone');
assert(html.includes('id="cloudMemorySection"'),'Cloud memory should be directly reachable within settings');
assert(html.includes('id="searchToggle"'),'Web search control should remain visible');
assert(html.includes("updateViaCache:'none'"),'Phone PWA must check for updated service workers');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert(sw.includes("event.respondWith(fetch(r,{cache:'no-cache'})"),'PWA JavaScript should use updated network copy before cached fallback');

assert.equal(config.name,'nova-ai');
assert.equal(config.ai.binding,'AI');
assert.match(config.main,/NOVA_3_Phone_Deploy_Worker\.js/);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate control IDs');
const refs=[...inline[1].matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]);
for(const ref of refs)assert(ids.includes(ref),'Missing user interface control: '+ref);
for(const feature of ['function continueAnswer','function appendContinuation','function buildContext','function storeArtifact','function artifactDocument','function renderArtifactLibrary','function downloadArtifact','function makeArtifactFromAnswer']){
 assert(inline[1].includes(feature),'Missing feature: '+feature);
}
for(const feature of ['runAIWithFallback','NOVA_SITE_ORIGIN','function modelOptions','function parseRequest','reasoning_effort']){
 assert(worker.includes(feature),'Missing Worker feature: '+feature);
}
assert(html.includes('<script src="./nova-native-weights.js"></script>'),'Pretrained NOVA Native weights not loaded by website');
assert(html.includes('<script src="./nova-native.js"></script>'),'Original NOVA Native browser model not loaded by NOVA');
assert(fs.existsSync(path.join(root,'nova-native.js')),'Original NOVA Native model source missing');
assert(worker.includes('"/nova-native-weights.js"'),'Cloudflare app bundle must serve pretrained NOVA Native weights');
assert(worker.includes('"/nova-native.js"'),'Cloudflare app bundle must serve NOVA Native model');
assert(worker.includes('const EMBEDDED_ASSETS'),'Cloudflare Worker does not include the standalone website bundle');
assert(worker.includes('function artifactDocument'),'Cloudflare Worker bundle does not include new artifacts UI');
console.log('NOVA frontend, artifacts, deployment and backend smoke checks passed.');

assert(html.includes('id="testPro"'),'Missing NOVA Pro diagnostic button');
assert(worker.includes("nova-pro-reliability-v1"),'Worker release version missing');
assert(worker.includes('async function verifiedProResponse'),'Verified NOVA Pro response handler missing');
assert(worker.includes("'/api/diagnose'"),'Worker diagnostic endpoint missing');

// Use mocked Workers AI only, never spend actual AI quota in CI.
async function checkPro(){
 const backend=worker.slice(worker.indexOf('// NOVA 3 — Cloudflare Worker.'));
 const evaluate=new Function(backend.replace('export default {','const handler = {')+'\nreturn {handler};');
 const {handler}=evaluate();
 const calls=[];
 const env={
  NOVA_PASSCODE:'demo_passcode_123',
  NOVA_ENABLE_PAID_PRO:'false',
  AI:{async run(model,options){
   calls.push({model,stream:options.stream,effort:options.reasoning_effort});
   if(model.includes('qwen'))return{choices:[{message:{content:''},finish_reason:'stop'}]};
   return{choices:[{message:{content:'READY'},finish_reason:'stop'}]};
  }}
 };
 const request=new Request('https://nova-ai.example.workers.dev/api/diagnose',{
  method:'POST',headers:{'Origin':'https://exclusive2knight.github.io','Content-Type':'application/json','X-NOVA-Passcode':'demo_passcode_123'},body:'{}'
 });
 const response=await handler.fetch(request,env);
 assert.equal(response.status,200,'NOVA Pro diagnostic should return 200 after fallback');
 const data=await response.json();
 assert.equal(data.ok,true);
 assert.equal(data.usedFallback,true,'Empty Qwen output should trigger fallback');
 assert.equal(data.model,'GLM 4.7 Flash');
 assert.equal(calls[0].stream,false,'Pro must validate non-stream content before replying');
 assert.equal(calls[1].effort,undefined,'GLM must not receive Qwen-only reasoning_effort');
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://exclusive2knight.github.io');
 const badRequest=new Request('https://nova-ai.example.workers.dev/api/diagnose',{
  method:'POST',headers:{'Origin':'https://exclusive2knight.github.io','Content-Type':'application/json','X-NOVA-Passcode':'incorrect-passcode'},body:'{}'
 });
 const denied=await handler.fetch(badRequest,env);
 assert.equal(denied.status,401,'Diagnostics must reject invalid passcodes');
 console.log('NOVA Pro diagnostic and fallback simulated tests passed.');
}
checkPro().catch(e=>{console.error(e);process.exitCode=1});

