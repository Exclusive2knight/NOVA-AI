/* NOVA Native: our own small neural model. Test offline learning and usable projects. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','nova-native.js'),'utf8');
const store=new Map();
const localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)};
const context={window:{},localStorage,setTimeout,console};
vm.runInNewContext(src,context,{filename:'nova-native.js'});
const brain=context.window.NOVANative;
assert(brain&&typeof brain.train==='function','NOVA Native neural network missing');
assert(!brain.status().trained,'Native model should start untrained');
async function run(){
 const events=[];
 await brain.train(event=>events.push(event.label));
 const info=brain.status();
 assert(info.trained,'Original neural weights should train on-device');
 assert.equal(info.epochs,75,'Unexpected initial training passes');
 assert(info.parameters>10000,'Neural network has no parameter weights');
 assert(events.some(s=>s.includes('Training')),'Training activity log missing');
 assert(store.size>0,'Trained weights not persisted in local storage');
 const projects=[
  ['make a website for my bakery','website'],
  ['make a todo app','todo'],
  ['make a notes app','notes'],
  ['make a timer','timer'],
  ['make a calculator','calculator'],
  ['build a dashboard','dashboard'],
  ['make a mini game','game'],
  ['create a portfolio website','portfolio']
 ];
 for(const [request,skill] of projects){
  const events=[];
  const result=brain.respond(request,{build:true,onStep:e=>events.push(e.label)});
  assert.equal(result.skill,skill,'Wrong skill for '+request);
  assert.deepEqual(Array.from(result.files,x=>x.path),['index.html','styles.css','script.js']);
  assert(result.files[0].content.startsWith('<!doctype html>'));
  new vm.Script(result.files[2].content,{filename:skill+'.js'});
  assert(events.some(x=>x.includes('Created index.html')),'No real file activity for '+skill);
 }
 const math=brain.respond('what is 8 * 7');
 assert(math.text.includes('56'),'Local math calculation missing');
 await brain.teach('design an appointment booking app','website');
 assert(brain.status().teachings===1,'Native teaching did not persist');
 assert(brain.status().epochs>75,'Native teaching did not update model weights');
 // The local neural network never calls a model API and works without a Worker.
 assert.equal(brain.status().provider,'None');
 assert.equal(brain.status().online,false);
 console.log('NOVA Native neural training, offline skill responses, 8 project templates, teaching and activity log: PASSED');
}
run().catch(error=>{console.error(error);process.exitCode=1});
