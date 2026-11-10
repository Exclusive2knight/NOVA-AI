/* NOVA Native Online: optional sourced reference search, not hosted AI inference.
 * Only the current search query is sent externally; no chat history, attachments
 * or model weights. Browser Wikipedia API fallback works without Cloudflare.
 */
(function(root){
'use strict';
const WIKI='https://en.wikipedia.org/w/api.php';
function queryText(text){
 return String(text||'')
  .replace(/^\s*(?:hey\s+nova[\s,:-]*|nova[\s,:-]*)/i,'')
  .replace(/^\s*(?:(?:please|could you|can you)\s+)?(?:look up|search(?: the (?:internet|web))? for|find (?:online )?(?:information|info) (?:about|on)|research|tell me (?:about|more about))\s*/i,'')
  .replace(/\s+/g,' ').trim().slice(0,220);
}
function plain(value){
 return String(value||'').replace(/<[^>]*>/g,' ')
  .replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g,k=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '}[k]))
  .replace(/&#(\d{1,6});/g,(_,n)=>String.fromCodePoint(Math.min(1114111,Number(n))))
  .replace(/\s+/g,' ').trim();
}
function cleanSources(list){
 if(!Array.isArray(list))return [];
 return list.slice(0,5).map(r=>({
  title:plain(r.title).slice(0,140),
  url:String(r.url||'').slice(0,650),
  content:plain(r.content||r.snippet||r.description).slice(0,650)
 })).filter(s=>{
  try{const u=new URL(s.url);return s.title&&u.protocol==='https:'}catch{return false}
 });
}
async function directWikipedia(query,signal){
 const url=new URL(WIKI);
 url.searchParams.set('action','query');
 url.searchParams.set('list','search');
 url.searchParams.set('srsearch',query);
 url.searchParams.set('srnamespace','0');
 url.searchParams.set('srlimit','5');
 url.searchParams.set('format','json');
 url.searchParams.set('origin','*');
 const response=await fetch(url.href,{mode:'cors',credentials:'omit',cache:'no-store',signal});
 if(!response.ok)throw Error('Wikipedia search returned '+response.status);
 const data=await response.json();
 if(data?.error)throw Error('Wikipedia lookup was unavailable');
 const sources=cleanSources((data?.query?.search||[]).map(r=>({
  title:r.title,
  url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(String(r.title||'').replace(/ /g,'_')),
  content:r.snippet
 })));
 return {provider:'Wikipedia',sources,mode:'direct'};
}
async function workerSearch(query,base,passcode,signal){
 const baseUrl=String(base||'').replace(/\/$/,'');
 if(!/^https:\/\/[a-z0-9.-]+\.workers\.dev$/i.test(baseUrl))throw Error('No Worker available');
 const headers={'Content-Type':'application/json'};
 if(passcode)headers['X-NOVA-Passcode']=passcode;
 const response=await fetch(baseUrl+'/api/native-search',{method:'POST',headers,
  body:JSON.stringify({query}),signal,cache:'no-store'});
 if(!response.ok)throw Error('Worker internet lookup not available ('+response.status+')');
 const data=await response.json();
 if(!Array.isArray(data.sources))throw Error('Unrecognized Worker search response');
 const engine=['brave','tavily'].includes(data.engine)?data.engine:null;
 return {provider:data.provider==='web'?('Full web search'+(engine?' · '+(engine==='brave'?'Brave':'Tavily'):'')):'Wikipedia',engine,sources:cleanSources(data.sources),mode:'worker'};
}
async function search(text,{backendUrl='',passcode='',signal,onStep}={}){
 const query=queryText(text);
 if(query.length<2)throw Error('Enter at least two characters to search online.');
 if(onStep)onStep({type:'web',label:'Sending only this search query to online sources'});
 if(backendUrl){
  try{
   const found=await workerSearch(query,backendUrl,passcode,signal);
   if(onStep)onStep({type:'web',label:'Received '+found.sources.length+' '+found.provider+' search results from Worker'});
   return {...found,query};
  }catch(e){
   if(signal?.aborted)throw e;
   if(onStep)onStep({type:'web',label:'Whole-web search unavailable or not configured; using Wikipedia references'});
  }
 }
 const direct=await directWikipedia(query,signal);
 if(onStep)onStep({type:'web',label:'Received '+direct.sources.length+' results from Wikipedia'});
 return {...direct,query};
}
function describe(result){
 const rows=result.sources||[];
 if(!rows.length)return 'NOVA Native Online could not find a relevant reference for “'+result.query+'”. Try more specific keywords.';
 const list=rows.slice(0,4).map((r,i)=>(i+1)+'. '+r.title+(r.content?' — '+r.content:''));
 return 'NOVA Native Online · '+result.provider+'\n\nHere are relevant search excerpts for “'+result.query+'”:\n\n'+list.join('\n\n')+'\n\nOpen the linked sources below to check the full information. This is sourced lookup, not a generated expert answer.';
}
// Web enabled does NOT mean every chat message should become a web lookup.
// Search explicit research requests and questions where fresh/public facts matter.
function shouldSearch(text,localResult,{enabled=false,build=false}={}){
 if(!enabled||build||localResult?.files?.length)return false;
 const q=String(text||'').trim().toLowerCase().replace(/\s+/g,' ');
 if(!q)return false;
 const explicit=/\b(?:search\s+(?:the\s+)?(?:web|internet|online)|search\s+for|look\s*up|browse\s+(?:the\s+)?(?:web|internet)|research\b|find\s+(?:me\s+)?(?:websites?|sources?|links?)|check\s+online|find\s+online|use\s+(?:the\s+)?internet|google\s+for)\b/i.test(q);
 if(explicit)return true;
 // Small talk (including common voice-typing mistakes) should get a regular
 // answer even when Web is turned on. Do not spend provider credits on it.
 const social=q.replace(/[.!?,]+$/g,'').trim();
 if(/^(?:hi|hey|hello|yo|sup|good (?:morning|afternoon|evening|night)|thank(?:s| you)|what(?:'s| is) up|how(?:'s| is) it going|how(?:'s| is) everything going|how (?:are|ar|r) (?:you|u|we|wi|with) (?:doing|doin|ding|going)(?: (?:today|now))?|what (?:are|r) we doing|who are you|what can you do|how was your day)$/.test(social))return false;
 if(['clarify','math','greeting'].includes(localResult?.skill))return false;
 if(/^(?:please\s+)?(?:make|build|create|design|generate)\s+(?:me\s+)?(?:a|an|the)?\s*/i.test(q))return false;
 // Personal and follow-up questions are conversations, not internet queries.
 if(/^(?:do you remember|what did (?:i|we)|what (?:about|should) (?:i|we)|can you help me|how (?:are|am) (?:i|we)|tell me what we|continue|keep going|fix (?:this|it)|try again)\b/i.test(q))return false;
 const fresh=/\b(?:latest|newest|recent|today|tonight|tomorrow|yesterday|current|currently|this week|this month|right now|breaking|live|news|weather|forecast|2026|2027|2028|as of)\b/i.test(q);
 // Stable public facts may warrant source lookup too; not ordinary dialogue.
 const factual=/^(?:what (?:is|are|was|were)|who (?:is|was|are|were)|when (?:is|was|did|does)|where (?:is|was|are|were)|why (?:is|are|does|did)|how (?:does|do|did|many|much|long)|tell me about|explain (?:what|why|how)|find out)\b/i.test(q);
 if(factual&&/\b(?:you|your|we|our|my|me|i)\b/i.test(q)&&!fresh)return false;
 return fresh||factual;
}
root.NOVANativeOnline={version:'1.1',queryText,cleanSources,search,describe,shouldSearch};
})(window);
