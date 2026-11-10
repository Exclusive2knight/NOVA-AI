/* NOVA product-behavior evaluation: fast deterministic regression gate.
 * Tests routing and privacy logic, NOT general-model intelligence or Claude parity.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const onlineJs=fs.readFileSync(path.join(root,'nova-online.js'),'utf8');
const sandbox={};
new Function('window','URL','fetch',onlineJs)(sandbox,URL,()=>{throw Error('No network expected')});
const online=sandbox.NOVANativeOnline;
const start=html.indexOf('function memoryCandidate(');
const end=html.indexOf('async function cloudMemoryStoreExchange(',start);
assert(start>=0&&end>start,'Explicit memory policy missing');
const memoryCandidate=new Function(html.slice(start,end)+'return memoryCandidate')();
let passed=0,total=0;
function check(name,predicate,expected){
 total++;
 const actual=!!predicate;
 assert.equal(actual,expected,name);
 passed++;
}
const memoryExamples=[
 ['Remember that Monarch Q6 is a quad motor hybrid',true],
 ['My driving game uses 4-wheel steering',true],
 ['We decided to use the original Tesla mesh',true],
 ['I prefer detailed UI screens',true],
 ['For my project we need a parking garage',true],
 ['I am building a car game on my phone',true],
 ['Please keep the original body style',true],
 ['The game has vehicles and houses',true],
 ['Note that our project should be landscape',true],
 ['My plan is to add more car models',true],
 ['How are we doing?',false],
 ['Thanks for helping',false],
 ['Search the web for hybrid cars',false],
 ['What is cloud computing?',false],
 ['Can you send me links?',false],
 ['I asked for this earlier?',false],
 ['Forget my previous conversation about cars',false],
 ['Delete my project memory',false],
 ['My password is abc123 and I prefer cars',false],
 ['Remember that the API key is private',false],
 ['My bank account is in these notes',false],
 ['Hello',false]
];
for(const [text,remember] of memoryExamples)check('Memory policy: '+text,memoryCandidate(text),remember);
const webExamples=[
 ['Hi NOVA',false],
 ['how ar with ding',false],
 ['What are we doing today?',false],
 ['What did we decide about the car?',false],
 ['Please fix my old model',false],
 ['Can you help me debug my game?',false],
 ['Tell me about our project',false],
 ['Search the web for EV charging laws',true],
 ['Look up newest Toyota SUVs',true],
 ['What is an electric vehicle?',true],
 ['Who was Ada Lovelace?',true],
 ['What is the latest news?',true],
 ['Summarize https://example.com/review',true],
 ['Read https://example.com/public-guide',true]
];
for(const [text,expected] of webExamples)check('Web policy: '+text,
 online.shouldSearch(text,{files:[],skill:'general'},{enabled:true}),expected);
assert(html.includes('id="smartChat"'),'Hosted smart chat control missing');
assert(html.includes('id="artifactFixErrors"'),'Preview repair UI missing');
assert(html.includes("function memoryForRequest()"),'Hosted memory injection wiring missing');
assert(html.includes('await cloudMemoryRecall(promptText)'),'Cloud memory not used in requests');
const success=100*passed/total;
console.log('NOVA routing/privacy product regression: '+passed+'/'+total+' cases passed ('+success.toFixed(1)+'%). Not a model-IQ score.');
