/* NOVA Native 1.0 — original on-device neural intent model and local skills.
   No model API, pretrained weights, hosted inference, or remote training service.
   Honest capability: supervised intent classifier + deterministic local tools,
   not a general-purpose generative language model.
*/
(function(global){
'use strict';
const KEY='nova-native-v2';
const CATEGORIES=['greeting','website','portfolio','todo','notes','timer','calculator','quiz','dashboard','game','math','summary','explain','creative','code','memory','general'];
const SAMPLES={
 greeting:['hello','hi nova','hey','good morning','good evening','how are you','whats up','hello there','hey nova','say hello','greetings','hi'],
 website:['build a website','make a website for a cafe','create a landing page','design a modern site','build a webpage','make a business website','create a responsive website','generate html site','build an app interface','create a web page','make a homepage','design a clean site'],
 portfolio:['make a portfolio','build portfolio website','personal portfolio site','create a developer portfolio','my projects portfolio','showcase my work online','resume website','creative work gallery','artist portfolio'],
 todo:['make a todo app','build a task list','create checklist application','task manager website','to do tracker','build todo list','interactive checklist','manage my tasks','make a task tracker'],
 notes:['make a notes app','create a note taking website','build a notepad','write down notes','simple notes editor','journal application','personal notebook website','make a writing app'],
 timer:['build a timer','make a stopwatch','countdown clock','create timer app','study timer','pomodoro app','start countdown','make a time tracker'],
 calculator:['make a calculator','build calculator app','design arithmetic calculator','calculator website','simple math tool','number calculator','build calculator with buttons'],
 quiz:['build a quiz','make trivia game','create interactive quiz','test my knowledge','quiz app','multiple choice questions','make flashcard quiz'],
 dashboard:['create an analytics dashboard','build a business dashboard','make an admin panel','show charts and reports','create data visualization','dashboard ui','statistics dashboard','project overview dashboard'],
 game:['make a simple game','build a browser game','create a clicker game','interactive mini game','create small arcade game','make a score counter game','game with points'],
 math:['what is 18 times 4','calculate 7+9','solve 12/4','what is 33-11','how much is 9*9','calculate 10 plus 6','evaluate 2*(9+3)','math problem','add numbers','multiply numbers'],
 summary:['summarize this text','give me a short summary','summarize the paragraph','shorten this writing','main ideas of this','summarize these notes','quick summary please'],
 explain:['explain how it works','what is javascript','what is a function','teach me about ai','explain this concept','what does this mean','how do neural networks work','help me understand','explain coding'],
 creative:['write a short story','give me name ideas','brainstorm some ideas','write a poem','suggest a creative title','help me brainstorm','invent a fictional name','make up a story'],
 code:['write some code','generate javascript function','help with python','make html and css','show coding example','code snippet','explain javascript error','debug my code','give me programming example'],
 memory:['remember this','save this note','what did i tell you','what have you learned','teach nova something','learn this answer','show what you know','store my preference'],
 general:['what can you do','who are you','are you an ai','help me','tell me more','i need some help','what is nova native','what is your capability']
};
const EXTRA_SAMPLES = {"greeting":["good day","hello assistant","hiya","howdy","hey there","good afternoon","good morning nova","what's happening","nice meeting you","what's going on","hello friend","hi again","morning","evening","a quick hello","greet me","say hi to me","how is everything"],"website":["build a homepage for a store","make a landing page for a club","launch a business site","create a site for a restaurant","put together a webpage","design a page for customers","responsive homepage design","modern storefront page","a small company website","I need an online site","make a one page site","build a mobile website","design website interface","web site for a nonprofit","generate a website template","html page for a service","set up a homepage","small business online presence","build a public web page"],"portfolio":["show my creative projects online","make a gallery of my work","personal developer site","professional CV webpage","show my photographs","present my past projects","artist personal site","work samples page","my design work showcase","make a personal resume site","online professional portfolio","a photography gallery website","a career showcase","showcase skills and work","artist profile page","professional profile website","list my projects with pictures","design my personal site"],"todo":["daily task organizer","an app for chores","list tasks with checkboxes","track my daily duties","task planning list","build a checklist","make a task organizer","workout habit task list","interactive list of things to do","manage assignments","track completed tasks","add and delete tasks","chores checklist","shopping list with completed items","daily goals list","organize tasks on my phone","schedule my tasks","task tracking app"],"notes":["note taking app","a place to jot ideas","type in a notebook","a digital diary","make a writing notebook","personal notes editor","draft notes on a webpage","save ideas in a notepad","journal writing page","memo writing interface","quick jotting tool","make a simple note writer","text editor for notes","a diary I can type in","capture little thoughts","editable notes tool","keep written reminders","make a scratchpad"],"timer":["set a study countdown","build a focus clock","make an elapsed time counter","stopwatch with start and stop","time remaining display","pomodoro focus clock","pause a timer","countdown to zero","timer for studying","a kitchen countdown clock","start and pause seconds","count time with a stopwatch","digital clock countdown","build a focus session app","workout interval timer","track seconds passing","a timer I can reset","minutes and seconds clock"],"calculator":["numeric keypad for math","a page with number buttons","four operation arithmetic tool","calculator with plus and minus","arithmetic calculator page","on screen adding machine","a number calculation app","calculate using keypad","a math calculator website","make number input with equals","build a basic calculator","a simple math keypad","calculator with buttons","add subtract multiply divide tool","interactive arithmetic tool","a numerical calculating interface","digital pocket calculator","calculator project"],"quiz":["ask me trivia questions","multiple choice testing app","general knowledge quiz","an educational trivia game","interactive quiz with score","flashcard questions and answers","a science knowledge test","quiz with correct answers","make a history trivia site","play a geography quiz","a quiz with answer choices","knowledge testing game","ask students questions","a short trivia challenge","make an exam practice quiz","interactive questionnaire","test the user with questions","quiz questions and feedback"],"dashboard":["business analytics overview","stats and metrics homepage","make admin analytics panel","charts showing performance","track user statistics","data cards and charts","website traffic overview","visualize business data","a KPI dashboard","make a management panel","summary charts and reports","monitor revenue metrics","a screen for analytics","reporting dashboard interface","performance statistics cards","project tracking metrics","create an admin interface","business stats panel"],"game":["play an arcade game","a browser clicker challenge","make an interactive score game","create a tapping mini game","simple play game","game where points increase","a little arcade experience","tap the screen to score","create an entertainment game","time limited click challenge","mini game for kids","interactive game level","score counter game","arcade scoring website","a point collecting game","build a fun browser game","make a click speed game","tap for points"],"math":["what is 12 plus 16","multiply 24 by 3","divide 20 by five","work out 18 minus seven","evaluate the expression 5+6","solve the arithmetic problem","find the sum of two numbers","how much is forty plus two","add seventeen and nine","work out three times seven","the result of 6*8","calculate a numeric expression","basic arithmetic question","find what 7 times 6 equals","what is 50 divided by two","help calculate a total","do a quick math problem","simplify 2+2"],"summary":["condense a paragraph","write a concise summary","give the key takeaways","make a short recap","extract main points","summarize this document","provide the core ideas","shorten the text","what are the main takeaways","give me a brief recap","write bullet summary","pull out the important details","short summary of these notes","reduce a long article","summarize the passage","give an overview of this writing","extract essential information","recap this material"],"explain":["teach me a programming concept","how do arrays work","describe this concept","break down a difficult idea","help me understand computers","explain machine learning basics","what is a recursive function","tell me how a CPU works","walk through this explanation","how does a computer think","explain why this happens","define the concept","help me learn JavaScript","what does this code mean","clarify this topic","teach a lesson about coding","can you explain it","help me understand networking"],"creative":["brainstorm product names","come up with unique names","invent a fictional character","give original story ideas","write a poem","suggest catchy titles","creative name generator","imagine a fantasy world","think of a novel idea","make up a new brand","write a small tale","brainstorm interesting concepts","fictional story prompt","suggest business names","invent a new hero","creative writing ideas","think of a plot","make some creative suggestions"],"code":["write a JavaScript function","help me debug Python","create a code snippet","show a programming example","fix an error in my code","explain syntax highlighting","write CSS rules","how do loops work in Python","give me sample JavaScript","help with a program","build an algorithm","implement a coding function","generate some HTML code","create reusable function","show example source code","programming help with TypeScript","debug my JavaScript","an example in Python"],"memory":["remember a preference","store this information","keep this note for next time","save a fact about me","what do you remember","teach you a new example","learn this sentence","add this to memory","recall a saved note","what did I say earlier","review saved lessons","save this for later","remember a new fact","update stored details","show my saved preferences","help you learn an intent","remember my settings","train with a sample"],"general":["tell me your capabilities","what can you do today","what are your limits","who built you","how do I use NOVA","tell me about your features","can you help","what is this application","give me an introduction","what kind of assistant are you","what tasks are possible","tell me your purpose","explain your limitations","what are you good at","help me get started","can I ask a question","I need help","describe yourself"]};
const D=1024,H=48,K=CATEGORIES.length,ALPHA=0.035;
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function tokenize(s){return String(s).toLowerCase().match(/[a-z0-9]+/g)||[]}
function vector(s){
 const words=tokenize(s).slice(0,85),freq=new Map();
 const add=(token,weight)=>{const i=hash(token)%D;freq.set(i,(freq.get(i)||0)+weight)};
 for(let i=0;i<words.length;i++){
  const word=words[i];add('w:'+word,1.2);
  if(word.length>=5){add('pre:'+word.slice(0,4),0.38);add('suf:'+word.slice(-4),0.28)}
  if(i)add('b:'+words[i-1]+'_'+word,1.35);
 }
 if(words.length<3)add('short',0.15);
 const entries=[...freq.entries()],norm=Math.sqrt(entries.reduce((n,[i,v])=>n+v*v,0))||1;
 return entries.map(([i,v])=>[i,v/norm]);
}
function seedRand(){let x=0x51a7f11;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function newNet(){
 const rand=seedRand(),W1=new Float32Array(D*H),b1=new Float32Array(H),W2=new Float32Array(H*K),b2=new Float32Array(K);
 for(let i=0;i<W1.length;i++)W1[i]=(rand()-.5)*.15;
 for(let i=0;i<W2.length;i++)W2[i]=(rand()-.5)*.15;
 return {W1,b1,W2,b2,epochs:0};
}
function forward(net,x){
 const hidden=new Float32Array(H),logits=new Float32Array(K);
 for(let j=0;j<H;j++){let z=net.b1[j];for(const [i,v] of x)z+=net.W1[j*D+i]*v;hidden[j]=Math.tanh(z)}
 let max=-Infinity;
 for(let k=0;k<K;k++){let z=net.b2[k];for(let j=0;j<H;j++)z+=net.W2[k*H+j]*hidden[j];logits[k]=z;if(z>max)max=z}
 let total=0;for(let k=0;k<K;k++){logits[k]=Math.exp(logits[k]-max);total+=logits[k]}
 for(let k=0;k<K;k++)logits[k]/=total;
 return {hidden,probs:logits};
}
function step(net,x,label,lr){
 const {hidden,probs}=forward(net,x),dh=new Float32Array(H);
 for(let j=0;j<H;j++){
  let v=0;for(let k=0;k<K;k++)v+=(probs[k]-(k===label?1:0))*net.W2[k*H+j];
  dh[j]=v*(1-hidden[j]*hidden[j]);
 }
 for(let k=0;k<K;k++){const delta=probs[k]-(k===label?1:0);net.b2[k]-=lr*delta;for(let j=0;j<H;j++)net.W2[k*H+j]-=lr*delta*hidden[j]}
 for(let j=0;j<H;j++){net.b1[j]-=lr*dh[j];for(const [i,v] of x)net.W1[j*D+i]-=lr*dh[j]*v}
}
function examples(memory){
 const rows=[];
 for(const [intent,samples] of Object.entries(SAMPLES))for(const item of samples)rows.push([vector(item),CATEGORIES.indexOf(intent)]);
 for(const [intent,samples] of Object.entries(EXTRA_SAMPLES))for(const item of samples){
  const label=CATEGORIES.indexOf(intent);
  rows.push([vector(item),label]);
  rows.push([vector('please '+item),label]);
  rows.push([vector(item+' please'),label]);
 }
 for(const item of memory||[])if(CATEGORIES.includes(item.intent))rows.push([vector(item.prompt),CATEGORIES.indexOf(item.intent)]);
 return rows;
}
function saveState(net,teachings){
 try{
  localStorage.setItem(KEY,JSON.stringify({v:2,epochs:net.epochs,W1:Array.from(net.W1),b1:Array.from(net.b1),W2:Array.from(net.W2),b2:Array.from(net.b2),teachings:teachings.slice(-90)}));
 }catch(e){}
}
function loadState(){
 try{
  const s=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!s||s.v!==2||s.W1?.length!==D*H||s.W2?.length!==H*K||s.b1?.length!==H||s.b2?.length!==K)return null;
  return {net:{W1:Float32Array.from(s.W1),b1:Float32Array.from(s.b1),W2:Float32Array.from(s.W2),b2:Float32Array.from(s.b2),epochs:s.epochs||0},teachings:Array.isArray(s.teachings)?s.teachings.slice(-90):[]};
 }catch(e){return null}
}
let state=loadState()||{net:newNet(),teachings:[]},ready=!!state.net.epochs,training=null;
function status(){return{model:'NOVA Native 2.0',architecture:'Original supervised neural network: 1024 input, 48 hidden, 17 intent outputs',parameters:D*H+H+H*K+K,epochs:state.net.epochs,trained:ready,teachings:state.teachings.length,online:false,provider:'None'}}
function pause(){return new Promise(resolve=>setTimeout(resolve,0))}
async function train(onStep){
 if(training)return training;
 training=(async()=>{
  const rows=examples(state.teachings),net=state.net;
  if(onStep)onStep({type:'train',label:'Training original NOVA Native neural weights locally'});
  const start=net.epochs,goal=start>0?start+18:75;
  for(let epoch=start;epoch<goal;epoch++){
   // Fixed permutation with reproducible modular stride, changed across epochs.
   for(let k=0;k<rows.length;k++){
    const idx=(k*73+epoch*11)%rows.length;
    step(net,rows[idx][0],rows[idx][1],ALPHA/(1+epoch*.01));
   }
   net.epochs=epoch+1;
   if(epoch%10===0){if(onStep)onStep({type:'train',label:'Neural training '+Math.round((epoch+1)/goal*100)+'%'});await pause()}
  }
  ready=true;saveState(net,state.teachings);
  if(onStep)onStep({type:'train',label:'NOVA Native neural model ready ('+net.epochs+' training passes)'});
  return status();
 })().finally(()=>{training=null});
 return training;
}
function classify(prompt){
 const {probs}=forward(state.net,vector(prompt));
 const order=[...CATEGORIES.keys()].sort((a,b)=>probs[b]-probs[a]);
 return {intent:CATEGORIES[order[0]],confidence:Number(probs[order[0]].toFixed(3)),alternative:CATEGORIES[order[1]]};
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&#39;':'&#39;'}[c]))}
function safeJS(s){return JSON.stringify(String(s)).replace(/</g,'\\u003c')}
function projectTitle(prompt){
 let t=String(prompt).replace(/^(?:please\s*)?(?:make|build|create|design|generate|show)\s+(?:me\s*)?(?:a|an|the)?\s*(?:(?:simple|modern|beautiful|clean|professional|interactive|responsive|cool)\s*)*(?:website|webpage|web\s*app|page|site|portfolio|dashboard|game|app|task\s*list|todo|notepad|notes|timer|calculator|quiz)\s*(?:for|about|called|named|of)?\s*/i,'').trim();
 if(!t||t.length>80||/^(please|this|it)$/i.test(t))t='My NOVA Project';
 return t.replace(/[^\p{L}\p{N}\s\-_&]/gu,'').slice(0,54)||'My NOVA Project';
}
function baseCSS(){
 return ':root{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#142337;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}header{background:#122035;color:#fff;padding:22px clamp(20px,5vw,64px);display:flex;justify-content:space-between;align-items:center;gap:20px}header strong{font-size:21px;letter-spacing:-.7px}header a{color:#c6d7f2;text-decoration:none}main{max-width:1000px;margin:auto;padding:50px 24px}h1{font-size:clamp(32px,6vw,62px);letter-spacing:-.045em;line-height:1.1;margin:0 0 20px}p{color:#55667d;line-height:1.65}.hero{padding:54px 0}.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:#2365a2}.card{background:#fff;border:1px solid #d9e1eb;border-radius:16px;padding:24px;box-shadow:0 8px 24px #14233709}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}button,.btn{border:0;background:#2256a0;color:white;border-radius:10px;padding:13px 19px;cursor:pointer;font:600 14px system-ui}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #90b4f2;outline-offset:2px}input,textarea{font:16px system-ui;padding:13px;border:1px solid #bdcbdc;border-radius:10px;width:100%;background:#fff;color:#142337}footer{padding:30px 24px;text-align:center;color:#68768a;font-size:12px}@media(max-width:600px){header{padding:16px 20px}main{padding:26px 17px}.hero{padding:30px 0}}';
}
function template(kind,prompt){
 const title=projectTitle(prompt),safe=escapeHTML(title);
 const shell=(body,script)=>[
 {path:'index.html',content:'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safe+'</title><link rel="stylesheet" href="styles.css"></head><body><header><strong>'+safe+'</strong><a href="#main">Explore</a></header><main id="main">'+body+'</main><footer>Created locally with NOVA Native · Editable demo</footer><script src="script.js"></script></body></html>'},
 {path:'styles.css',content:baseCSS()},
 {path:'script.js',content:script||'// Edit your new NOVA Native project here.\n'}
 ];
 if(kind==='todo')return shell('<section class="hero"><div class="eyebrow">TASK MANAGER</div><h1>Get things done.</h1><p>Add tasks, mark them complete, or remove them.</p></section><div class="card"><form id="taskForm"><input id="task" required maxlength="160" placeholder="Add a task" aria-label="New task"><button type="submit" style="margin-top:10px">Add task</button></form><ul id="tasks" aria-label="Tasks"></ul></div>',
 'const list=document.getElementById("tasks");document.getElementById("taskForm").addEventListener("submit",e=>{e.preventDefault();const input=document.getElementById("task");const text=input.value.trim();if(!text)return;const item=document.createElement("li");item.style.cssText="margin:14px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap";const label=document.createElement("label");const check=document.createElement("input");check.type="checkbox";check.style.width="auto";const span=document.createElement("span");span.textContent=text;check.onchange=()=>{span.style.textDecoration=check.checked?"line-through":""};label.append(check,span);const del=document.createElement("button");del.textContent="Delete";del.onclick=()=>item.remove();item.append(label,del);list.append(item);input.value="";input.focus()});');
 if(kind==='notes')return shell('<section class="hero"><div class="eyebrow">NOTES</div><h1>Write it down.</h1><p>Draft notes below, then export them to a text file.</p></section><div class="card"><textarea id="notes" rows="14" placeholder="Your notes..." aria-label="Your notes"></textarea><button id="download" style="margin-top:12px">Export TXT</button></div>',
 'document.getElementById("download").onclick=()=>{const blob=new Blob([document.getElementById("notes").value],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="notes.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};');
 if(kind==='timer')return shell('<section class="hero"><div class="eyebrow">FOCUS TIMER</div><h1>Time to focus.</h1><p>Original locally generated timer with pause and reset.</p></section><div class="card"><h1 id="clock" aria-live="polite">25:00</h1><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="start">Start</button><button id="pause">Pause</button><button id="reset">Reset</button></div></div>',
 'let left=25*60,running=null;const el=document.getElementById("clock");function draw(){el.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0")}document.getElementById("start").onclick=()=>{if(running)return;running=setInterval(()=>{if(left>0)left--;else{clearInterval(running);running=null;}draw()},1000)};document.getElementById("pause").onclick=()=>{clearInterval(running);running=null};document.getElementById("reset").onclick=()=>{clearInterval(running);running=null;left=1500;draw()};');
 if(kind==='calculator')return shell('<section class="hero"><div class="eyebrow">CALCULATOR</div><h1>Quick calculations.</h1><p>Four-operation expression calculator.</p></section><div class="card"><input id="expr" placeholder="Example: (12+8)/4" aria-label="Math expression"><button id="calculate" style="margin-top:12px">Calculate</button><h2 id="result" aria-live="polite"></h2></div>',
 'document.getElementById("calculate").onclick=()=>{const x=document.getElementById("expr").value.replace(/\\s+/g,"");const output=document.getElementById("result");if(!/^[0-9+*/().-]{1,80}$/.test(x)){output.textContent="Use digits and arithmetic symbols only";return}try{const v=Function("\\"use strict\\";return ("+x+")")();output.textContent=Number.isFinite(v)?String(v):"Undefined result"}catch(e){output.textContent="Invalid expression"}};');
 if(kind==='game')return shell('<section class="hero"><div class="eyebrow">MINI GAME</div><h1>Tap to score.</h1><p>How many points can you earn in 20 seconds?</p></section><div class="card"><p>Score: <strong id="score">0</strong> · Time: <strong id="time">20</strong>s</p><button id="tap" style="font-size:24px;padding:35px 48px">TAP ME</button><button id="reset">Restart</button></div>',
 'let score=0,time=20,tick=null;const update=()=>{document.getElementById("score").textContent=score;document.getElementById("time").textContent=time};document.getElementById("tap").onclick=()=>{if(time<=0)return;if(!tick)tick=setInterval(()=>{time--;update();if(time<=0){clearInterval(tick);tick=null}},1000);score++;update()};document.getElementById("reset").onclick=()=>{clearInterval(tick);tick=null;score=0;time=20;update()};');
 if(kind==='dashboard')return shell('<section class="hero"><div class="eyebrow">OVERVIEW</div><h1>'+safe+' dashboard</h1><p>Example metrics for your design. Replace these with your own real data.</p></section><div class="grid"><div class="card"><div class="eyebrow">ACTIVITY</div><h1>1,240</h1><p>Sample metric</p></div><div class="card"><div class="eyebrow">PROJECTS</div><h1>28</h1><p>Sample metric</p></div><div class="card"><div class="eyebrow">COMPLETION</div><h1>76%</h1><p>Sample metric</p></div></div><div class="card" style="margin-top:16px"><h2>Demo chart</h2><div class="grid"><div style="height:100px;background:#b7cfee"></div><div style="height:150px;background:#77a3db"></div><div style="height:180px;background:#296bb9"></div></div></div>','');
 return shell('<section class="hero"><div class="eyebrow">WELCOME</div><h1>'+safe+'</h1><p>A responsive website built locally by NOVA Native. Edit the content, design, and interactions from the Files tab.</p><a class="btn" href="#features" style="display:inline-block;text-decoration:none">Explore features</a></section><section id="features" class="grid"><article class="card"><div class="eyebrow">01</div><h2>Thoughtful design</h2><p>Clean, flexible styling for any screen size.</p></article><article class="card"><div class="eyebrow">02</div><h2>Editable files</h2><p>Customize HTML, CSS, and JavaScript yourself.</p></article><article class="card"><div class="eyebrow">03</div><h2>Made locally</h2><p>No third-party model needed to create this demo.</p></article></section>','document.querySelectorAll("a[href^=\\"#\\"]").forEach(a=>a.addEventListener("click",e=>{const id=a.getAttribute("href").slice(1),section=document.getElementById(id);if(section){e.preventDefault();section.scrollIntoView({behavior:"smooth"})}}));');
}
function mathResult(text){
 const math=String(text).replace(/\bwhat is\b|\bcalculate\b|\bsolve\b|\bevaluate\b|\bequals?\b|\bplease\b|\bhow much is\b/gi,'').replace(/\bplus\b/gi,'+').replace(/\bminus\b/gi,'-').replace(/\bmultiplied by\b|\btimes\b/gi,'*').replace(/\bdivided by\b/gi,'/').replace(/\s/g,'');
 if(!/^[\d.+\-*/()]{1,100}$/.test(math))return null;
 try{
  // Calculator input is restricted to numbers and operators, not arbitrary JS text.
  const answer=Function('"use strict";return ('+math+')')();
  if(typeof answer==='number'&&Number.isFinite(answer))return String(answer);
 }catch(e){}
 return null;
}
function summarize(text){
 const source=String(text).replace(/^\s*(summarize|shorten|give me a summary of)\s*(this|the following|:)?\s*/i,'');
 if(source.length<110)return 'Paste a longer paragraph after “summarize” and NOVA Native can extract the main sentences. This is extractive summarization, not a full language model.';
 const sentences=source.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[source];
 const words=tokenize(source).filter(w=>w.length>3),freq={};for(const w of words)freq[w]=(freq[w]||0)+1;
 const ranked=sentences.map((s,i)=>({s:s.trim(),i,score:tokenize(s).reduce((n,w)=>n+(freq[w]||0),0)/Math.max(5,tokenize(s).length)}));
 return ranked.sort((a,b)=>b.score-a.score).slice(0,Math.min(3,Math.ceil(sentences.length*.4))).sort((a,b)=>a.i-b.i).map(x=>x.s).join(' ');
}
function directAnswer(kind,prompt,confidence){
 const q=String(prompt).trim();
 if(kind==='math'||/^[\s\d+\-*/().]+$/.test(q)){const value=mathResult(q);if(value!==null)return 'Result: '+value+'\n\nCalculated locally on this device.'}
 if(kind==='summary')return summarize(q);
 if(kind==='greeting')return 'Hello! I am NOVA Native, our own small neural model running on your device. I can build simple websites, task apps, timers, notes, and calculators without Cloudflare. Tell me what to create.';
 if(kind==='memory')return 'NOVA Native can learn new intent examples. Open Settings → Train NOVA Native to add an example. All weights and examples remain on this device.';
 if(kind==='explain')return 'I am a small neural intent model, not a general knowledge model yet. My network learns how to classify requests, and local code handles supported tasks. For detailed explanations, NOVA needs a larger original language model trained on a much broader dataset.';
 if(kind==='code')return 'I can generate runnable HTML, CSS and JavaScript for supported projects. Try “Build a simple website”, “Make a todo app”, or “Create a timer”. More advanced coding requires expanding the model and tools.';
 if(kind==='creative')return 'Idea starter: combine one familiar feature with one unexpected feature. For example, a personal dashboard with an interactive focus timer and project checklist. I can create a simple working prototype.';
 return 'NOVA Native is running entirely on your device. I am trained to recognize '+CATEGORIES.length+' types of requests, but I cannot answer every general question accurately yet. Try asking for a website, todo app, timer, notes app, calculator, dashboard or simple game.';
}
function respond(prompt,{build=false,onStep}={}){
 if(!ready)throw Error('NOVA Native needs training first. Open Settings → Train NOVA Native.');
 const add=(label,type)=>{if(onStep)onStep({type:type||'work',label})};
 add('Tokenizing your request locally');
 const selected=classify(prompt);add('Neural intent prediction: '+selected.intent+' ('+Math.round(selected.confidence*100)+'% confidence)');
 let kind=selected.intent;
 // Explicit task keywords resolve ambiguity when the small model is uncertain.
 const q=String(prompt).toLowerCase();
 if(/\b(todo|to-do|task list|checklist)\b/.test(q))kind='todo';
 else if(/\b(notes app|notepad|notebook app)\b/.test(q))kind='notes';
 else if(/\b(timer|stopwatch|countdown|pomodoro)\b/.test(q))kind='timer';
 else if(/\b(calculator app|make a calculator|build a calculator)\b/.test(q))kind='calculator';
 else if(/\b(dashboard|analytics page)\b/.test(q))kind='dashboard';
 else if(/\b(clicker game|mini game)\b/.test(q))kind='game';
 else if(/\bportfolio\b/.test(q))kind='portfolio';
 else if(/\b(website|webpage|landing page|web app)\b/.test(q))kind='website';
 else if(/^(summarize|shorten)\b/.test(q))kind='summary';
 else if(/^(calculate|what is\s*[0-9]|[0-9()+\-*/. ]+$)/i.test(q))kind='math';
 if(kind!==selected.intent)add('Matched supported local skill: '+kind+' (checked task words)');
 const supported=['website','portfolio','todo','notes','timer','calculator','dashboard','game'];
 const make=build||(/\b(build|create|make|design|generate)\b/.test(q)&&supported.includes(kind));
 if(make&&supported.includes(kind)){
  add('Planning a '+kind+' project');
  const files=template(kind,prompt);
  for(const f of files)add('Created '+f.path,'file');
  add('Validating project file paths and preparing preview');
  return {text:'NOVA Native created a '+kind+' project using its own local skills. This is an editable starting point, not a frontier-model generated app.',files,skill:kind,confidence:selected.confidence};
 }
 const text=directAnswer(kind,prompt,selected.confidence);
 add('Prepared local response; no cloud request used');
 return {text,files:[],skill:kind,confidence:selected.confidence};
}
async function teach(prompt,intent){
 if(!CATEGORIES.includes(intent)||!prompt||String(prompt).length>250)throw Error('Choose a supported intent and a short example');
 state.teachings.push({prompt:String(prompt),intent});
 state.teachings=state.teachings.slice(-90);
 await train();
 return status();
}
function reset(){try{localStorage.removeItem(KEY)}catch(e){}state={net:newNet(),teachings:[]};ready=false}
global.NOVANative={version:'2.0',categories:CATEGORIES.slice(),status,train,respond,classify,teach,reset};
})(window);
