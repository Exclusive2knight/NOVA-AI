/* NOVA image understanding security and isolated uploaded-image handling.
 * Cloudflare inference mocked; no images or provider quota used in CI.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const backend=fs.readFileSync(path.join(root,'cloudflare','NOVA_3_Phone_Deploy_Worker.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('id="photoButton"'),'Photo button missing');
assert(html.includes('id="photoInput"'),'Photo input missing');
assert(html.includes('async function compressedPhotoData('),'Photo conversion missing');
assert(html.includes("canvas.toDataURL('image/jpeg'"),'Photos must be re-encoded to remove metadata');
assert(html.includes("apiEndpoint('/api/vision')"),'Frontend vision request missing');
assert(!html.includes('cloudMemoryStoreExchange(question'),'Vision must not automatically write images to D1');
const backendStart=backend.indexOf('// NOVA 3 — Cloudflare Worker.');
const server=new Function(backend.slice(backendStart).replace('export default {','const entry = {')+'\nreturn entry;')();
const goodImage='data:image/jpeg;base64,'+'A'.repeat(280);
function makeRequest(image=goodImage,passcode='vision-secret-123',origin='https://exclusive2knight.github.io',question='What is in this picture?'){
 return new Request('https://nova-ai.example.workers.dev/api/vision',{method:'POST',
 headers:{Origin:origin,'X-NOVA-Passcode':passcode,'Content-Type':'application/json'},
 body:JSON.stringify({image,question})});
}
async function run(){
 const calls=[];
 const env={NOVA_PASSCODE:'vision-secret-123',AI:{async run(model,input){
  calls.push({model,input});return {response:'An orange cartoon car on a road.'}
 }}};
 let r=await server.fetch(makeRequest(),env);
 assert.equal(r.status,200);
 const result=await r.json();
 assert(result.answer.includes('cartoon car'));
 assert.equal(result.imageSaved,false);
 assert.equal(calls.length,1);
 assert.equal(calls[0].model,'@cf/meta/llama-3.2-11b-vision-instruct');
 assert.equal(calls[0].input.image,goodImage);
 r=await server.fetch(makeRequest(goodImage,'wrong-password'),env);
 assert.equal(r.status,401,'Only owner may spend Cloudflare vision quota');
 r=await server.fetch(makeRequest(goodImage,'vision-secret-123','https://unauthorized.example'),env);
 assert.equal(r.status,403,'Unknown origins should be rejected');
 r=await server.fetch(makeRequest('data:image/svg+xml;base64,'+'A'.repeat(280)),env);
 assert.equal(r.status,400,'SVG and arbitrary MIME content must be rejected');
 r=await server.fetch(makeRequest('data:image/jpeg;base64,'+'A'.repeat(1550000)),env);
 assert.equal(r.status,413,'Oversized images must be rejected');
 r=await server.fetch(makeRequest(),{NOVA_PASSCODE:env.NOVA_PASSCODE});
 assert.equal(r.status,503,'No Workers AI binding must fail clearly');
 assert.equal(calls.length,1,'Invalid vision requests must not spend AI quota');
 const licenseEnv={NOVA_PASSCODE:env.NOVA_PASSCODE,AI:{async run(){throw Error('Please agree to Meta license')}}};
 r=await server.fetch(makeRequest(),licenseEnv);
 assert.equal(r.status,409,'Missing Meta license must give actionable error');
 console.log('NOVA vision: photo controls, metadata stripping, auth, input validation, AI selection and license errors PASSED');
}
run().catch(e=>{console.error(e);process.exitCode=1});
