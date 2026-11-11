/* NOVA Appearance Studio — regression tests for settings, animations and mobile UX.
 * Node-only; no browser account, external APIs, images or cloud quota needed.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'nova-ui.css'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const expected={
 accentSelect:['ice','violet','mint','sunset'],
 chatSizeSelect:['small','normal','large'],
 bubbleSelect:['soft','outline','flat'],
 themeSelect:['dark','light','system'],
 motionSelect:['system','subtle','full','off']
};
for(const [id,values] of Object.entries(expected)){
 const field=new RegExp('<select\\s+id="'+id+'"[^>]*>([\\s\\S]*?)<\\/select>').exec(html);
 assert(field,'Appearance select missing: '+id);
 for(const value of values)assert(field[1].includes('value="'+value+'"'),'Option '+value+' missing from '+id);
}
assert(html.includes('id="glassToggle" type="checkbox"'),'Glass effect must have a real checkbox');
assert(html.includes('id="novaWorkingVisual"'),'A genuinely active working bar should exist');
assert(html.includes('id="novaWorkingText"'),'Actual task descriptions must be visible');
assert(html.includes('id="topSettings"'),'Mobile Settings action must remain accessible');
for(const id of Object.keys(expected).concat('glassToggle')){
 assert(html.includes("$('"+id+"')"),'UI JavaScript must reference '+id);
}
for(const key of ["el.dataset.accent=","el.dataset.chatSize=","el.dataset.bubble=","el.dataset.glass=","el.dataset.motion=","el.dataset.density="]){
 assert(html.includes(key),'Live settings preview must update '+key);
}
assert(html.includes("addEventListener('close',()=>setTheme())"),
 'Closing settings without saving must restore the persisted appearance');
for(const key of ["state.accent=","state.chatSize=","state.bubbleStyle=","state.glassUi="]){
 assert(html.includes(key),'Personalization must persist '+key);
}
assert(html.includes("document.documentElement.dataset.busy=busy?'true':'false'"),
 'Work animation must reflect actual busy state');
assert(html.includes("$('novaWorkingText').textContent=label"),
 'Processing indicators must report actual task steps');
for(const cls of [
 ':root[data-accent="violet"]',':root[data-accent="mint"]',':root[data-accent="sunset"]',
 ':root[data-chat-size="large"]',':root[data-bubble="outline"]',':root[data-bubble="flat"]',
 ':root[data-glass="on"]',':root[data-glass="off"]',
 ':root[data-busy="true"] .nova-working',':root[data-motion="off"]',
 '@media(prefers-reduced-motion:reduce)','@media(max-width:520px)',
 '#topSettings{display:grid'
]){
 assert(css.includes(cls),'Required mobile/accessible style missing: '+cls);
}
const embedded=html.match(/<script>\(\(\)=>\{([\s\S]*?)<\/script>/);
assert(embedded,'NOVA main application script absent');
new vm.Script(embedded[0].slice('<script>'.length,-'</script>'.length));
assert(sw.includes("nova-shell-v"),'Offline PWA must retain a cache version');
console.log('NOVA Appearance Studio: settings, preview/rollback, real-work animations, accessibility, mobile controls and application JS syntax PASSED');
