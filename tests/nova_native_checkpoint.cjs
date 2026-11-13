/* Reproducible tests for NOVA Native 2 trained neural checkpoint.
   No external model, network, credentials, or paid services.
*/
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const modelSource=fs.readFileSync(path.join(root,'nova-native.js'),'utf8');
const bundleSource=fs.readFileSync(path.join(root,'nova-native-weights.js'),'utf8');
const contexts=[
 {name:'Original unseen task set',filename:'native_holdout_v2.json',threshold:.80},
 {name:'Second unseen task set',filename:'native_holdout_extra.json',threshold:.65}
];
const saved=new Map();
const storage={
 getItem:k=>saved.get(k)||null,
 setItem:(k,v)=>saved.set(k,v),
 removeItem:k=>saved.delete(k)
};
const context={window:{},localStorage:storage,setTimeout,console};
vm.runInNewContext(bundleSource,context,{filename:'nova-native-weights.js'});
vm.runInNewContext(modelSource,context,{filename:'nova-native.js'});
const native=context.window.NOVANative;
assert(native?.status().trained,'The pretrained model must load without on-device training');
assert.equal(native.status().source,'bundled checkpoint');
assert.equal(native.status().parameters,50033);
assert(native.status().epochs>=75, "Checkpoint must have at least 75 verified training passes");
const reports=[];
for(const spec of contexts){
 const evaluation=JSON.parse(fs.readFileSync(path.join(root,'training',spec.filename),'utf8'));
 let correct=0;
 const errors=[];
 for(const item of evaluation.items){
  const classification=native.classify(item.prompt);
  if(classification.intent===item.intent)correct++;
  else errors.push({intent:item.intent,guess:classification.intent});
 }
 const accuracy=correct/evaluation.items.length;
 console.log(spec.name+': '+correct+'/'+evaluation.items.length+' = '+(accuracy*100).toFixed(1)+'%');
 assert(accuracy>=spec.threshold,'Checkpoint performance regressed on '+spec.filename);
 reports.push({set:spec.name,correct,total:evaluation.items.length,accuracy});
}
assert.equal(native.respond('what is 7 * 8').text.includes('56'),true);
const generated=native.respond('build a website for a coffee shop',{build:true});
assert.equal(generated.files.length,3);
assert(generated.files.some(x=>x.path==='index.html'));
console.log('NOVA Native 2: compressed checkpoint, heldout benchmarks and local projects passed.');
