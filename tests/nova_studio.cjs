/* NOVA Studio interaction and language regression tests: no API calls or network access. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),css=read('nova-ui.css');
const scripts=['nova-native-weights.js','nova-native.js','nova-language.js'];
const storage=new Map();
const context={window:{},localStorage:{
 getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)
},setTimeout,console};
for(const file of scripts)vm.runInNewContext(read(file),context,{filename:file});
const brain=context.window.NOVANative,language=context.window.NOVALanguage;
assert(brain?.status().trained,'NOVA Native pretrained model must load');
assert(language&&typeof language.interpret==='function','NOVA language adapter missing');
assert.equal(brain.status().parameters,50033);
for(const file of ['nova-ui.css',...scripts])assert(html.includes('./'+file),'NOVA UI must load '+file);
for(const control of ['focusToggle','densitySelect','motionSelect','slangAssist','showActivity','modelStatusBadge']){
 assert(html.includes('id="'+control+'"'),'Missing interactive UI control '+control);
}
for(const selector of ['.message.fresh','.intro h1','.topbar','.work-section','@media(prefers-reduced-motion:reduce)']){
 assert(css.includes(selector),'Missing design style '+selector);
}
const inline=html.match(/<script>\(\(\)=>\{([\s\S]*?)<\/script>/);
assert(inline,'Main UI script missing');
new vm.Script(inline[0].slice('<script>'.length,-'</script>'.length));
const cases=[
 ['yo can u mak me a wesbite for my cars fr rn','website',true],
 ['pls create sum todo app 4 homework','todo',true],
 ['bruh i need a timmer for studyin','timer',true],
 ['cud u build a calculater app','calculator',true],
 ['make me a dashbord for my shop fr','dashboard',true],
 ['lemme make a portfollio for pics','portfolio',true],
 ['plz make a notepad app asap','notes',true],
 ['can u creat a quiz frfr','quiz',true],
 ['create a clicker game rn','game',true],
 ['explain wat javascript is pls','explain',false],
 ['gimme a short summary of this please','summary',false],
 ['qzxt qwjkr blaagh whwz','clarify',false],
 ['zzzxqkfd asdajkja qwertzz','clarify',false]
];
for(const [prompt,expected,needsArtifact] of cases){
 const steps=[];
 const result=language.respond(brain,prompt,{build:false,onStep:e=>steps.push(e.label)});
 assert.equal(result.skill,expected,'Wrong task interpretation: '+prompt);
 if(needsArtifact){
  assert.equal(result.files.length,3,'Missing editable artifact: '+prompt);
  const js=result.files.find(f=>f.path==='script.js');
  assert(js,'Missing editable JS');
  new vm.Script(js.content,{filename:'generated-'+expected+'.js'});
 }
 if(expected==='clarify')assert(/not sure|rephrase/i.test(result.text),'Must clarify opaque gibberish');
}
const actual=language.interpret('yo can u mak me a wesbite fr');
assert(actual.edits.length>=3,'Slang interpretation should disclose changes');
assert.equal(brain.status().provider,'None','Native must not require a cloud model');
console.log('NOVA Studio UI, animation settings, local language adaptation, quiz and artifact regressions: PASSED ('+cases.length+' cases)');
