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
assert(worker.includes('const EMBEDDED_ASSETS'),'Cloudflare Worker does not include the standalone website bundle');
assert(worker.includes('function artifactDocument'),'Cloudflare Worker bundle does not include new artifacts UI');
console.log('NOVA frontend, artifacts, deployment and backend smoke checks passed.');
