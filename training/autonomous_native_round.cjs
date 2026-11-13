/* NOVA Native AutoLab: genuine further neural-network optimization with a fixed holdout gate.
 * Fully offline, original labeled examples only. Never scrapes chats or runs remote inference.
 * Usage: node training/autonomous_native_round.cjs [--apply] [--report path]
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const opts=new Set(process.argv.slice(2));
const apply=opts.has('--apply');
const reportFlag=process.argv.indexOf('--report');
const reportPath=reportFlag>=0?path.resolve(process.argv[reportFlag+1]||''):path.join(root,'native-learning-report.json');
if(reportFlag>=0&&(!process.argv[reportFlag+1]||opts.has(process.argv[reportFlag+1])))throw Error('--report requires a path');
const weightsPath=path.join(root,'nova-native-weights.js');
const bundle=fs.readFileSync(weightsPath,'utf8');
const src=fs.readFileSync(path.join(root,'nova-native.js'),'utf8');
const suiteNames=['native_holdout_v2.json','native_holdout_extra.json'];
const suites=suiteNames.map(name=>({name,items:JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8')).items}));
function create(){
 const store=new Map();
 const localStorage={
  getItem:key=>store.get(key)||null,
  setItem:(key,value)=>store.set(key,value),
  removeItem:key=>store.delete(key)
 };
 const ctx={window:{},localStorage,setTimeout,console};
 vm.runInNewContext(bundle,ctx,{filename:'nova-native-weights.js',timeout:3000});
 vm.runInNewContext(src,ctx,{filename:'nova-native.js',timeout:3000});
 if(ctx.window.NOVANative?.status().source!=='bundled checkpoint')throw Error('Bundled checkpoint failed to load');
 return {model:ctx.window.NOVANative,store};
}
function measure(model){
 return suites.map(s=>{
  let correct=0,penalty=0,confidentErrors=0;const correctMask=[];
  for(const item of s.items){
   const prediction=model.classify(item.prompt);
   const confidence=Number(prediction.confidence);
   if(!Number.isFinite(confidence)||confidence<0||confidence>1)throw Error('Invalid confidence');
   const match=prediction.intent===item.intent;
   correctMask.push(match);
   if(match)correct++;else if(confidence>.85)confidentErrors++;
   penalty+=Math.pow(match?1-confidence:1+confidence,2);
  }
  return {suite:s.name,total:s.items.length,correct,accuracy:Number((correct/s.items.length).toFixed(4)),
   meanPenalty:Number((penalty/s.items.length).toFixed(6)),confidentErrors,correctMask};
 });
}
function gate(before,after){
 const findings=[];
 for(let i=0;i<before.length;i++){
  if(after[i].correct<before[i].correct)findings.push(after[i].suite+': accuracy regressed');
  if(Array.isArray(before[i].correctMask)&&before[i].correctMask.some((wasCorrect,k)=>wasCorrect&&!after[i].correctMask?.[k]))findings.push(after[i].suite+': previously correct example forgotten');
  if(after[i].meanPenalty>before[i].meanPenalty+.003)findings.push(after[i].suite+': confidence-calibrated error regressed');
  if(after[i].confidentErrors>before[i].confidentErrors)findings.push(after[i].suite+': confidently wrong answers increased');
 }
 const oldPenalty=before.reduce((n,s)=>n+s.meanPenalty*s.total,0);
 const newPenalty=after.reduce((n,s)=>n+s.meanPenalty*s.total,0);
 const improvedAccuracy=after.some((s,i)=>s.correct>before[i].correct);
 if(!improvedAccuracy&&newPenalty>=oldPenalty-.02)findings.push('No measurable held-out improvement');
 return {promote:findings.length===0,findings,oldPenalty:Number(oldPenalty.toFixed(5)),newPenalty:Number(newPenalty.toFixed(5))};
}
function compress(values){
 let max=0;for(const n of values)max=Math.max(max,Math.abs(n));
 const scale=max?max/32767:1;
 const bytes=Buffer.alloc(values.length*2);
 for(let i=0;i<values.length;i++)bytes.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(values[i]/scale))),i*2);
 return {count:values.length,scale,data:bytes.toString('base64')};
}
function bundleFrom(store){
 const state=JSON.parse(store.get('nova-native-v2')||'null');
 if(!state||!Number.isSafeInteger(state.epochs)||state.epochs<75)throw Error('Training did not produce a valid checkpoint');
 const tensors={W1:compress(state.W1),b1:compress(state.b1),W2:compress(state.W2),b2:compress(state.b2)};
 const data={version:2,epochs:state.epochs,network:'NOVA Native 2.0',
  type:'verified original neural network, int16 compressed',tensors};
 return '/* NOVA Native 2.0: original, held-out-gated int16 neural checkpoint. */\nwindow.NOVA_NATIVE_BUNDLE='+JSON.stringify(data)+';\n';
}
async function run(){
 const {model,store}=create(),before=measure(model);
 const startingEpochs=model.status().epochs;
 await model.train();
 const candidateEpochs=model.status().epochs;
 if(candidateEpochs!==startingEpochs+18)throw Error('Expected exactly 18 additional training passes');
 const after=measure(model);
 const decision=gate(before,after);
 const report={version:1,model:'NOVA Native 2.0',kind:'neural-intent-classifier',date:new Date().toISOString(),
  startedEpochs:startingEpochs,candidateEpochs,trainingPasses:18,trainingData:'original embedded labeled intent examples only',
  baseline:before,candidate:after,decision,
  heldoutWarning:'Selection repeatedly uses the same small holdouts; results can overfit and are not general intelligence measures.',
  hostedModelUpdated:false,webScraping:false,userChatsCollected:false,liveWeightsChanged:false};
 if(decision.promote&&apply){
  const next=bundleFrom(store);
  // Verify round-trip into a fresh model before replacing any published checkpoint.
  const original=fs.readFileSync(weightsPath,'utf8');
  try{
   vm.runInNewContext(next,{window:{}},{timeout:3000});
   const sandbox={window:{},localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},setTimeout,console};
   vm.runInNewContext(next,sandbox,{timeout:3000});
   vm.runInNewContext(src,sandbox,{timeout:3000});
   if(sandbox.window.NOVANative.status().epochs!==candidateEpochs)throw Error('Compressed checkpoint could not be reloaded');
   const verified=measure(sandbox.window.NOVANative);
   if(verified.some((suite,i)=>suite.correct<before[i].correct))throw Error('Quantized checkpoint regressed after round-trip');
   // Quantization must still pass the same gate, not just the raw network.
   const quantizedGate=gate(before,verified);
   if(!quantizedGate.promote)throw Error('Quantized checkpoint did not meet promotion gate');
   fs.writeFileSync(weightsPath+'.tmp',next,'utf8');
   fs.renameSync(weightsPath+'.tmp',weightsPath);
   report.liveWeightsChanged=true;
   report.verifiedQuantized=verified;
  }catch(error){
   report.decision={...decision,promote:false,findings:[...decision.findings,'Verification failed: '+error.message]};
   if(fs.existsSync(weightsPath+'.tmp'))fs.unlinkSync(weightsPath+'.tmp');
   if(fs.readFileSync(weightsPath,'utf8')!==original)fs.writeFileSync(weightsPath,original,'utf8');
  }
 }
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});
 fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n','utf8');
 console.log(JSON.stringify(report,null,2));
 return report;
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1});
module.exports={gate,compress,run};
