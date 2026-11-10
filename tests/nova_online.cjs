/* NOVA Native internet lookup: source handling, direct CORS fallback and Worker security.
 * All HTTP responses are mocked; no paid API calls or network in CI.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const client=fs.readFileSync(path.join(root,'nova-online.js'),'utf8');
const backend=fs.readFileSync(path.join(root,'cloudflare','NOVA_3_Phone_Deploy_Worker.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sandbox={};
const calls=[];
let workerAvailable=false;
const wikiResponse={query:{search:[
 {title:'Electric vehicle',snippet:'An <span class="searchmatch">electric</span> vehicle uses an electric motor.'},
 {title:'Battery',snippet:'A &quot;device&quot; that stores chemical energy.'}
]}};
async function fakeFetch(url,opts={}){
 const address=String(url);calls.push({address,opts});
 if(address.includes('/api/native-search')){
  if(!workerAvailable)return new Response(JSON.stringify({error:'not deployed'}),{status:404,headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify({provider:'wikipedia',sources:[
   {title:'Battery',url:'https://en.wikipedia.org/wiki/Battery',content:'Stored energy'}
  ]}),{status:200,headers:{'Content-Type':'application/json'}});
 }
 if(address.includes('/w/api.php'))return new Response(JSON.stringify(wikiResponse),{status:200,headers:{'Content-Type':'application/json'}});
 if(address.includes('/w/rest.php/v1/search/page'))return new Response(JSON.stringify({pages:[
   {title:'Electric vehicle',description:'An electrically powered vehicle'}
 ]}),{status:200,headers:{'Content-Type':'application/json'}});
 if(address.includes('api.tavily.com'))return new Response(JSON.stringify({results:[
   {title:'Public information',url:'https://example.org/reference',content:'A sample excerpt'}
 ]}),{status:200,headers:{'Content-Type':'application/json'}});
 throw Error('Unexpected outbound URL: '+address);
}
new Function('window','fetch','URL',client)(sandbox,fakeFetch,URL);
const online=sandbox.NOVANativeOnline;
assert(online,'Browser online helper missing');
async function test(){
 assert.equal(online.queryText('Can you search the web for electric vehicles?'),'electric vehicles?');
 assert(online.shouldSearch('What is an electric vehicle?',{files:[],skill:'general'},{enabled:true}));
 assert(!online.shouldSearch('Build a habit tracker',{files:[{path:'index.html'}],skill:'habit'},{enabled:true}));
 assert(!online.shouldSearch('what is 2+2',{files:[],skill:'math'},{enabled:true}));
 assert(!online.shouldSearch('qzx pzzzz',{files:[],skill:'clarify'},{enabled:true}));
 const a=await online.search('search the web for electric vehicles',{backendUrl:'https://nova-ai.example.workers.dev'});
 assert.equal(a.mode,'direct','Browser should fall back to public Wikipedia');
 assert.equal(a.sources.length,2);
 assert.equal(a.sources[0].content.includes('<span'),false,'Source snippets must be plain text');
 assert(calls.some(x=>x.address.includes('origin=*')),'MediaWiki browser CORS parameter required');
 assert(online.describe(a).includes('linked sources'));
 workerAvailable=true;
 const b=await online.search('Electric vehicle',{backendUrl:'https://nova-ai.example.workers.dev'});
 assert.equal(b.mode,'worker');
 assert.equal(b.sources[0].title,'Battery');

 const start=backend.indexOf('// NOVA 3 — Cloudflare Worker.');
 assert(start>=0,'Missing Worker backend marker');
 const run=new Function('fetch',backend.slice(start).replace('export default {','const WorkerEntry = {')+'\nreturn WorkerEntry;');
 const worker=run(fakeFetch);
 const req=(query,origin='https://exclusive2knight.github.io',secret='')=>new Request(
  'https://nova-ai.example.workers.dev/api/native-search',
  {method:'POST',headers:{'Origin':origin,'Content-Type':'application/json',...(secret?{'X-NOVA-Passcode':secret}:{})},body:JSON.stringify({query})}
 );
 let response=await worker.fetch(req('electric vehicles'),{});
 assert.equal(response.status,200,'Wikimedia lookup must work with no AI binding or passcode');
 let obj=await response.json();
 assert.equal(obj.provider,'wikipedia');
 assert(obj.sources.length>0);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://exclusive2knight.github.io');
 response=await worker.fetch(req('electric vehicles','https://untrusted.example'),{});
 assert.equal(response.status,403,'Untrusted origin must be rejected');
 response=await worker.fetch(req('x'),{});
 assert.equal(response.status,400,'Too-short requests must be rejected');
 let before=calls.length;
 response=await worker.fetch(req('electric vehicles'),{TAVILY_API_KEY:'demo'},);
 assert.equal(response.status,200);
 assert.equal((await response.json()).provider,'wikipedia','Anonymous search must never spend metered Tavily credits');
 assert(calls.slice(before).every(c=>!c.address.includes('tavily')));

 response=await worker.fetch(req('electric vehicles','https://exclusive2knight.github.io','owner-passcode-123'),{
  TAVILY_API_KEY:'demo',NOVA_PASSCODE:'owner-passcode-123'
 });
 assert.equal(response.status,200);
 assert.equal((await response.json()).provider,'web','Private authorized search can use the configured full-web provider');

 assert(html.includes('<script src="./nova-online.js"></script>'));
 assert(html.includes('window.NOVANativeOnline.search('));
 assert(html.includes('state.model===\'native\'&&state.search'));
 console.log('NOVA Native Online: CORS fallback, Worker references, no AI requirement, owner-only metered web search and UI integration PASSED.');
}
test().catch(error=>{console.error(error);process.exitCode=1});
