/* NOVA Create Studio routes text prompts to real image/GLB generators. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'nova-ui.css'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const src=fs.readFileSync(path.join(root,'nova-create.js'),'utf8');
const scope={};
let last;
new Function('window','fetch',src)(scope,async(endpoint,options)=>{
 last={endpoint,options};
 return {ok:true,json:async()=>({image:'data:image/jpeg;base64,'+'A'.repeat(300),model:'FLUX.1 schnell'})};
});
const maker=scope.NOVACreate;assert(maker);
for(const prompt of [
 'Make a realistic picture of a car',
 'Generate a photo of a red 2025 SUV',
 'Draw an image of a garage',
 'Create a cinematic wallpaper with a blue car',
 'Picture of a new car'
])assert.equal(maker.route(prompt),'image',prompt);
for(const prompt of [
 'Generate a GLB model of a truck',
 'Make me a 3D model of a parking garage',
 'Create a 3D asset of a tree',
 'GLB of a house'
])assert.equal(maker.route(prompt),'glb',prompt);
for(const prompt of ['What is a car?','hello','Remember my car design','Look up EV reviews']){
 assert.equal(maker.route(prompt),null,'No hijacking ordinary chat: '+prompt);
}
for(const id of ['openImageCreator','openGLBCreator','novaCreateDialog','novaCreatePrompt','novaCreateRun','novaCreateDownload','novaCreateSpec','novaCreatedImage','novaCreated3D'])
 assert(html.includes('id="'+id+'"'),'Missing creator control: '+id);
assert(html.includes("NOVA3D.build(prompt"),'UI must call real GLB generator');
assert(html.includes("NOVACreate.generateImage(apiEndpoint('')"),'Image requests must use NOVA Worker');
assert(html.includes('createdAssetKey'),'Generated media should be available in chat during the session');
assert(html.includes("new AbortController()"),'Creator needs cancellation');
assert(css.includes('.nova-create-dialog'),'Creator must be responsive');
assert(sw.includes("'./nova-3d.js'")&&sw.includes("'./nova-create.js'"),'Creator scripts must be available offline after install');
maker.generateImage('https://nova-ai.example.workers.dev','owner-private-passcode',{prompt:'Green electric SUV',style:'game',ratio:'wide'})
.then(data=>{
 assert(data.image.startsWith('data:image/jpeg'));
 assert.equal(last.endpoint,'https://nova-ai.example.workers.dev/api/image');
 assert.equal(last.options.headers['X-NOVA-Passcode'],'owner-private-passcode');
 assert.deepEqual(JSON.parse(last.options.body),{prompt:'Green electric SUV',style:'game',ratio:'wide'});
 console.log('NOVA Create: image/GLB prompt routing, auth API request, mobile UI, offline scripts and chat result integration PASSED');
}).catch(error=>{console.error(error);process.exitCode=1});
