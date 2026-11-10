/* NOVA Language Assist 1.0
   Local slang, typo and informal phrasing adapter for NOVA Native.
   It does not create a new frontier model or pretend to understand nonsense.
*/
(function(global){
'use strict';
const SLANG={
 u:'you',ur:'your',urs:'yours',r:'are',yall:'you all',pls:'please',plz:'please',
 plss:'please',cud:'could',wud:'would',shud:'should',cna:'can',wanna:'want to',
 gonna:'going to',lemme:'let me',gimme:'give me',ima:'i am going to',imma:'i am going to',
 ion:'i do not',idk:'i do not know',dunno:'do not know',cuz:'because',bc:'because',
 bcz:'because',rn:'right now',atm:'at the moment',fr:'for real',frfr:'for real',
 ngl:'not going to lie',tbh:'to be honest',btw:'by the way',asap:'as soon as possible',
 abt:'about',lmk:'let me know',ik:'i know',lowkey:'kind of',highkey:'really',
 finna:'going to',tryna:'trying to',jus:'just',js:'just',sum:'some',smth:'something',
 sth:'something',tht:'that',dis:'this',dat:'that',da:'the',wat:'what',wht:'what',
 wut:'what',y:'why',bruh:'hey',bro:'hey',yooo:'hello',yo:'hello',heyyy:'hello',
 af:'very',rly:'really',ppl:'people',pic:'picture',pics:'pictures',vid:'video',
 vids:'videos',alr:'alright',bet:'okay',aight:'alright',thx:'thanks',ty:'thank you',
 websitee:'website',websit:'website',wesbite:'website',webiste:'website',
 timmer:'timer',stopwach:'stopwatch',calculater:'calculator',dashbord:'dashboard',
 portfollio:'portfolio',portfoli:'portfolio',buld:'build',maek:'make',mak:'make',
 creat:'create',cn:'can',appp:'app',gmae:'game',gibbrish:'gibberish',
 schedual:'schedule',gud:'good',thnk:'think',copp:'copy',acutally:'actually'
};
const TASKS=['website','webpage','portfolio','dashboard','timer','countdown','stopwatch',
 'calculator','quiz','checklist','notes','notepad','game','javascript','python',
 'math','summarize','summary','create','build','make','design','explain','help',
 'todo','tasks','app','artifact','model','train','learn','chat','message','hello',
 'settings','portfolio','homepage','browser','interactive','project'];
const BASE=['you','your','are','with','for','please','could','would','can','want','to',
 'some','help','i','we','me','my','a','an','the','and','of','but','when','now','do',
 'how','what','where','who','at','in','on','is','it','that','this','thing','any',
 'something','like','why','yes','no','a','its','one','get','make','use','have',
 'from','start','try','need','want','using','up','give','show','doing','more'];
const KNOWN=new Set([...TASKS,...BASE,...Object.values(SLANG).flatMap(x=>x.split(' '))]);
function wordDistance(a,b,limit=2){
 if(a===b)return 0;if(Math.abs(a.length-b.length)>limit)return limit+1;
 let prev=Array.from({length:b.length+1},(_,i)=>i),prevPrev=null;
 for(let i=1;i<=a.length;i++){
  const next=[i];let best=i;
  for(let j=1;j<=b.length;j++){
   let value=Math.min(prev[j]+1,next[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   if(prevPrev&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])value=Math.min(value,prevPrev[j-2]+1);
   next[j]=value;best=Math.min(best,value);
  }
  if(best>limit)return limit+1;
  prevPrev=prev;prev=next;
 }
 return prev[b.length];
}
function interpret(input){
 const original=String(input||'').slice(0,12000);
 const edits=[];
 const text=original.replace(/[a-zA-Z]+(?:'[a-z]+)?/g,token=>{
  const k=token.toLowerCase();
  let replacement=SLANG[k];
  if(!replacement&&k.length>=5&&!KNOWN.has(k)){
   const limit=k.length>=7?2:1,candidates=TASKS.filter(t=>wordDistance(k,t,limit)<=limit);
   if(candidates.length===1)replacement=candidates[0];
  }
  if(replacement&&replacement!==k){edits.push(token+' → '+replacement);return replacement}
  return token;
 }).replace(/\s+/g,' ').trim();
 const words=text.toLowerCase().match(/[a-z0-9]+/g)||[];
 const known=words.filter(w=>KNOWN.has(w));
 const commands=/\b(build|create|make|design|website|webpage|portfolio|timer|notes|notepad|calculator|dashboard|game|quiz|summarize|explain|help|hello|what|math|calculate|checklist|project|todo)\b/i.test(text);
 const opaque=words.length>=2&&!commands&&words.filter(w=>w.length>=4).length>=2&&known.length/words.length<.16;
 return {original,text,edits:edits.slice(0,16),unclear:opaque};
}
function hintCategory(text){
 const q=String(text||'').toLowerCase();
 const matches=[
 ['todo',/\b(todo|to-do|task list|checklist|chores|tick off|tasks to do)\b/],
 ['notes',/\b(notes app|notepad|notebook app|journal app|diary app)\b/],
 ['timer',/\b(timer|stopwatch|countdown|pomodoro|focus clock)\b/],
 ['calculator',/\b(calculator|arithmetic keypad|number calculator)\b/],
 ['dashboard',/\b(dashboard|analytics panel|metrics panel|stats overview|kpi)\b/],
 ['portfolio',/\b(portfolio|resume website|photography gallery|creative showcase)\b/],
 ['quiz',/\b(quiz|trivia|multiple choice)\b/],
 ['game',/\b(clicker game|arcade game|mini game|tap game)\b/],
 ['website',/\b(website|webpage|landing page|homepage|online storefront|web app)\b/],
 ['summary',/^\s*(summarize|shorten|condense|recap)\b/],
 ['math',/^\s*(calculate|what is\s*\d|[\d()+*/.\s-]+$)/]
 ];
 return matches.find(([intent,pattern])=>pattern.test(q))?.[0]||null;
}
function respond(native,prompt,opts={}){
 const {enabled=true,onStep,build=false}=opts;
 if(!enabled)return native.respond(prompt,{build,onStep});
 const understood=interpret(prompt);
 if(understood.edits.length&&onStep)onStep({type:'language',label:'Interpreted common slang or typos: '+understood.edits.join(', ')});
 if(understood.unclear){
  if(onStep)onStep({type:'language',label:'Meaning unclear · asking for clarification'});
  return {text:'I am not sure what that means yet. Can you rephrase what you want NOVA to do? I can handle common slang and typos, but I will ask rather than invent an answer.',files:[],skill:'clarify',confidence:0,interpretation:understood.text};
 }
 // Modular skill registry adds many genuinely usable projects without changing
 // the 17-class neural checkpoint or pretending new categories were trained.
 const skillKey=global.NOVASkills?.recognize(understood.text);
 const creationAsked=build||/\b(build|make|create|design|generate|put together|set up|mock up|make me|need a|need an|want a|want an)\b/i.test(understood.text);
 if(skillKey&&creationAsked){
  const skillResult=global.NOVASkills.respond(understood.text,{onStep});
  if(skillResult){
   if(understood.edits.length)skillResult.interpretation=understood.text;
   return skillResult;
  }
 }
  const hint=hintCategory(understood.text);
 if(hint&&onStep)onStep({type:'language',label:'Recognized supported task: '+hint});
 let cleaned=understood.text;
 if(hint==='website'&&!/\b(website|webpage|landing page|web app)\b/i.test(cleaned))cleaned='Build a website: '+cleaned;
 else if(hint==='portfolio'&&!/\bportfolio\b/i.test(cleaned))cleaned='Make a portfolio website: '+cleaned;
 else if(hint==='todo'&&!/\b(todo|task list|checklist)\b/i.test(cleaned))cleaned='Make a todo app: '+cleaned;
 else if(hint==='notes'&&!/\b(notes app|notepad)\b/i.test(cleaned))cleaned='Make a notes app: '+cleaned;
 else if(hint==='timer'&&!/\btimer\b/i.test(cleaned))cleaned='Make a timer: '+cleaned;
 else if(hint==='dashboard'&&!/\bdashboard\b/i.test(cleaned))cleaned='Build a dashboard: '+cleaned;
 else if(hint==='quiz'&&!/\bquiz\b/i.test(cleaned))cleaned='Make a quiz: '+cleaned;
 const asksForCreation=/\b(build|make|create|design|generate|put together|set up|mock up|make me|need a|need an|want a|want an)\b/i.test(cleaned);
 const shouldBuild=build||(asksForCreation&&['website','portfolio','todo','notes','timer','calculator','dashboard','game','quiz'].includes(hint));
 const result=native.respond(cleaned,{build:shouldBuild,onStep});
 // Return the interpretation as transparent metadata, not as an invented chain of thought.
 if(understood.edits.length)result.interpretation=understood.text;
 return result;
}
global.NOVALanguage={version:'1.0',interpret,hintCategory,respond};
})(window);
