/* Rebuild NOVA Native's original trained weights from source.
   No third-party models, network services, or paid training required.
   Node.js 20+: node training/rebuild_native_weights.cjs
*/
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'nova-native.js'),'utf8');
const map=new Map(),store={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
const context={window:{},localStorage:store,setTimeout,console};
vm.runInNewContext(source,context,{filename:'nova-native.js'});
const model=context.window.NOVANative;
function pack(values){
 let max=0;for(const value of values)max=Math.max(max,Math.abs(value));
 const scale=max>0?max/32767:1,bytes=Buffer.alloc(values.length*2);
 for(let i=0;i<values.length;i++){
  const n=Math.max(-32767,Math.min(32767,Math.round(values[i]/scale)));
  bytes.writeInt16LE(n,i*2);
 }
 return {count:values.length,scale,data:bytes.toString('base64')};
}
async function main(){
 console.log('Training NOVA Native from its original random initialization...');
 await model.train(update=>{
  if(update.label.endsWith('%'))console.log(update.label);
 });
 const snapshot=JSON.parse(map.get('nova-native-v2'));
 if(!snapshot||snapshot.epochs!==75)throw Error('Training checkpoint did not complete');
 const checkpoint={
  version:2,epochs:snapshot.epochs,network:'NOVA Native 2.0',
  type:'trained from scratch, signed 16-bit symmetric quantization',
  tensors:{W1:pack(snapshot.W1),b1:pack(snapshot.b1),W2:pack(snapshot.W2),b2:pack(snapshot.b2)}
 };
 const result='/* NOVA Native 2.0: original trained weights, int16 compressed; no third-party pretrained model. */\nwindow.NOVA_NATIVE_BUNDLE='+JSON.stringify(checkpoint)+';\n';
 const destination=path.join(root,'nova-native-weights.js');
 fs.writeFileSync(destination,result,'utf8');
 console.log('Wrote '+destination+' ('+result.length+' bytes)');
 for(const name of ['native_holdout_v2.json','native_holdout_extra.json']){
  const suite=JSON.parse(fs.readFileSync(path.join(root,'training',name),'utf8')).items;
  let correct=0;for(const item of suite)if(model.classify(item.prompt).intent===item.intent)correct++;
  console.log(name+': '+correct+'/'+suite.length+' ('+(100*correct/suite.length).toFixed(1)+'%)');
 }
}
main().catch(error=>{console.error(error);process.exitCode=1});
