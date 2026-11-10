/* Tests for new modular NOVA Native skills and effectively uncapped local chat. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const files=['nova-native-weights.js','nova-native.js','nova-skills.js','nova-language.js'];
const cache=new Map(),context={window:{},setTimeout,console,localStorage:{
 getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v),removeItem:k=>cache.delete(k)
}};
for(const file of files)vm.runInNewContext(fs.readFileSync(path.join(base,file),'utf8'),context,{filename:file});
const native=context.window.NOVANative,skills=context.window.NOVASkills,lang=context.window.NOVALanguage;
assert(native.status().trained,'Bundled original neural checkpoint must load');
assert.equal(native.status().parameters,50033,'Do not silently alter trained neural model');
assert.equal(native.status().architecture.includes('17 intent outputs'),true);
assert.equal(skills.list().length,14);
const examples=[
 ['make a habit tracker','habit'],['build an expense tracker','budget'],
 ['create a kanban task board','kanban'],['make a flashcard app','flashcards'],
 ['create a drawing pad','drawing'],['build a color palette generator','palette'],
 ['create a random name picker','randomizer'],['make a calendar planner','calendar'],
 ['build an invoice generator','invoice'],['make a survey builder','survey'],
 ['create a unit converter','converter'],['build a recipe organizer','recipe'],
 ['create a bookmark manager','bookmarks'],['build a typing speed test','typography']
];
for(const [prompt,expected] of examples){
 const steps=[];
 const result=lang.respond(native,prompt,{onStep:e=>steps.push(e.label),enabled:true});
 assert.equal(result.skill,expected,'Did not understand '+prompt);
 assert.equal(result.files.length,3,'Must produce 3 editable files for '+expected);
 for(const file of result.files){
  assert(['index.html','styles.css','script.js'].includes(file.path));
  if(file.path==='script.js')new vm.Script(file.content,{filename:expected+'.js'});
 }
 assert(steps.some(x=>x.includes('Created index.html')),'Must log real file creation');
 // Skills still work with the separate slang adapter switched off.
 const unassisted=lang.respond(native,prompt,{enabled:false});
 assert.equal(unassisted.skill,expected);
}
assert(lang.respond(native,'asdfghjk qwertyz jzxqv',{enabled:true}).skill==='clarify','Unknown nonsense should not be invented');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
assert(html.includes('<script src="./nova-skills.js"></script>'),'Missing skills script in browser');
assert(html.includes("!['native','nova-tiny'].includes(state.model)&&state.enforceLimit"),'Personal goal must not block local models');
assert(html.includes('max="1000000"'),'Daily activity goals must support high counts without claiming provider capacity');
console.log('NOVA Skills: 14 independent interactive projects, source syntax, uncapped local chat and existing neural weights: PASSED');
