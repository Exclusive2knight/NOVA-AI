/* NOVA Strong Free: GPT-OSS 120B on existing Cloudflare Workers AI.
 * Mocked provider tests — do not consume quota or claim a live deployment.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const worker=fs.readFileSync(path.join(root,'cloudflare/NOVA_3_Phone_Deploy_Worker.js'),'utf8');
const script=worker.slice(worker.indexOf('// NOVA 3 — Cloudflare Worker.'));
const instance=new Function(script.replace('export default {','const entry = {')+'\nreturn entry;')();
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const calls=[];
const env={NOVA_PASSCODE:'private-owner-test',AI:{async run(model,input){
 calls.push({model,input});return {response:'A clear answer from the model.',finish_reason:'stop'};
}}};
function request(model='strong',passcode=env.NOVA_PASSCODE,origin='https://exclusive2knight.github.io'){
 return new Request('https://nova-ai.example.workers.dev/api/chat',{method:'POST',headers:{
 'Origin':origin,'X-NOVA-Passcode':passcode,'Content-Type':'application/json'
 },body:JSON.stringify({model,messages:[{role:'user',content:'Explain torque vectoring.'}],
 preferences:{length:'balanced',tone:'friendly',creativity:'precise'}})});
}
async function run(){
 let result=await instance.fetch(request(),env);
 assert.equal(result.status,200);
 assert(result.headers.get('Content-Type').includes('text/event-stream'));
 assert((await result.text()).includes('A clear answer'));
 assert.equal(calls.length,1);
 assert.equal(calls[0].model,'@cf/openai/gpt-oss-120b');
 assert.equal(calls[0].input.stream,false);
 assert(calls[0].input.max_tokens>200);
 assert.equal(calls[0].input.max_completion_tokens,undefined);
 assert.equal(calls[0].input.reasoning_effort,undefined);
 result=await instance.fetch(request('strong','bad-passcode'),env);
 assert.equal(result.status,401);
 result=await instance.fetch(request('strong',env.NOVA_PASSCODE,'https://untrusted.example'),env);
 assert.equal(result.status,403);
 assert.equal(calls.length,1,'Denied requests must not consume model quota');
 // If Strong is unavailable, NOVA falls back only to other free-compatible models.
 const fallback=[];
 const fallbackEnv={NOVA_PASSCODE:env.NOVA_PASSCODE,AI:{async run(model,opts){
  fallback.push(model);
  if(model==='@cf/openai/gpt-oss-120b')throw Error('Model temporarily unavailable');
  return {response:'Free-compatible Qwen fallback.'}
 }}};
 result=await instance.fetch(request(),fallbackEnv);
 assert.equal(result.status,200);
 assert((await result.text()).includes('Qwen 3.8'));
 assert.deepEqual(fallback,['@cf/openai/gpt-oss-120b','@cf/qwen/qwen3.8-27b']);
 assert(!fallback.includes('@cf/deepseek-ai/deepseek-v4.1-flash-1017'));
 // Existing NOVA Pro route is not silently replaced.
 const proCalls=[];
 result=await instance.fetch(request('pro'),{NOVA_PASSCODE:env.NOVA_PASSCODE,AI:{
  async run(model,opts){proCalls.push(model);return {response:'Qwen baseline.'}}
 }});
 assert.equal(result.status,200);
 assert.equal(proCalls[0],'@cf/qwen/qwen3.8-27b');
 assert(html.includes('value="strong"'),'Free Strong model must be selectable in UI');
 assert(html.includes('GPT-OSS 120B'),'Users must see the actual selected model');
 assert(html.includes('id="smartChat"'),'One-tap stronger model selector must remain');
 console.log('NOVA Strong Free: GPT-OSS 120B model, free-compatible fallback, owner auth, origin restrictions, UI PASSED');
}
run().catch(e=>{console.error(e);process.exitCode=1});
