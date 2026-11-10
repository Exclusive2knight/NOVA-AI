/* NOVA owner-only Cloudflare D1 memory: mocked database, no real API usage. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const workerSrc=fs.readFileSync(path.join(root,'cloudflare','NOVA_3_Phone_Deploy_Worker.js'),'utf8');
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
const schema=fs.readFileSync(path.join(root,'cloudflare','migrations','0001_nova_cloud_memory.sql'),'utf8');
assert(schema.includes('fts5'),'D1 should support searchable text memory');
assert(page.includes('id="cloudMemoryToggle"'),'Cloud memory enable switch missing');
assert(page.includes("cloudMemoryStoreExchange(promptText,answer.content)"),'Chat is not saved to cloud when opted in');
assert(page.includes("cloudMemoryExtra=await cloudMemoryRecall(promptText)"),'Chat does not retrieve cloud memory');
const backend=workerSrc.slice(workerSrc.indexOf('// NOVA 3 — Cloudflare Worker.'));
const entry=new Function(backend.replace('export default {','const WorkerEntry = {')+'\nreturn WorkerEntry;')();
const rows=[];
const db={prepare(sql){
 const stmt={
  params:[],
  bind(...values){this.params=values;return this;},
  async first(){if(sql.includes('COUNT(*)'))return {total:rows.length};if(sql.includes('SELECT id FROM nova_memories WHERE body=?'))return rows.find(r=>r.body===this.params[0])||null;throw Error('Unexpected mock DB first: '+sql)},
  async run(){
   if(sql.startsWith('INSERT INTO nova_memories')){
    const [body,source,created_at,id]=this.params;
    rows.push({body,source,created_at,id});
   }else if(sql==='DELETE FROM nova_memories WHERE id=?'){
    const pos=rows.findIndex(r=>r.id===this.params[0]);
    if(pos>=0)rows.splice(pos,1);
   }else if(sql==='DELETE FROM nova_memories'){rows.length=0}
   else throw Error('Unexpected mock DB write: '+sql);
   return {success:true};
  },
  async all(){
   if(sql.includes('WHERE nova_memories MATCH')){
    const terms=String(this.params[0]).match(/[a-z0-9]+/gi)||[];
    return {results:rows.filter(r=>terms.some(t=>r.body.toLowerCase().includes(t.toLowerCase())))
      .slice(0,7).map(r=>({id:r.id,source:r.source,created_at:r.created_at,text:r.body.slice(0,1500)}))};
   }
   if(sql.includes('ORDER BY CAST(created_at'))return {results:rows.slice(-60).reverse().map(r=>({
    id:r.id,source:r.source,created_at:r.created_at,text:r.body
   }))};
   throw Error('Unexpected mock DB query: '+sql);
  }
 };
 return stmt;
}};
const origin='https://exclusive2knight.github.io',base='https://nova-ai.example.workers.dev/api/memory';
function req(action,params={},secret='owner-memory-passcode',o=origin){
 return new Request(base,{method:'POST',headers:{
  Origin:o,'Content-Type':'application/json',...(secret?{'X-NOVA-Passcode':secret}:{})
 },body:JSON.stringify({action,...params})});
}
const env={NOVA_PASSCODE:'owner-memory-passcode',NOVA_MEMORY:db};
async function run(){
 let response=await entry.fetch(req('status'),env);
 assert.equal(response.status,200);
 assert.equal((await response.json()).stored,0);
 response=await entry.fetch(req('save',{text:'Monarch Q6 has quad motors and a supercharged V6',source:'note'}),env);
 assert.equal(response.status,200);
 const saved=await response.json();assert(saved.id&&saved.saved);
 const duplicate=await entry.fetch(req('save',{text:'Monarch Q6 has quad motors and a supercharged V6',source:'note'}),env);
 assert.equal((await duplicate.json()).duplicate,true,'Same memory must not be stored twice');
 assert.equal(rows.length,1);
 const sensitive=await entry.fetch(req('save',{text:'My password is a-secret-password'}),env);
 assert.equal(sensitive.status,400,'Secrets must not be saved to memory');
 assert.equal(rows.length,1);
 response=await entry.fetch(req('search',{query:'What did I say about Monarch Q6?'}),env);
 const result=await response.json();
 assert.equal(result.matches.length,1);
 assert(result.matches[0].text.includes('supercharged V6'));
 response=await entry.fetch(req('list'),env);
 assert.equal((await response.json()).memories.length,1);
 response=await entry.fetch(req('save',{text:'private data'}),'invalid');
 // Not a real env: should return an authorization response only if wired correctly.
 assert.equal(response.status,503);
 response=await entry.fetch(req('save',{text:'must not write'},'wrong-passcode'),env);
 assert.equal(response.status,401);
 response=await entry.fetch(req('save',{text:'wrong origin'},'owner-memory-passcode','https://bad.example'),env);
 assert.equal(response.status,403);
 assert.equal(rows.length,1,'Unauthorized users should not write memory');
 response=await entry.fetch(req('delete',{id:saved.id}),env);
 assert.equal((await response.json()).deleted,true);
 assert.equal(rows.length,0);
 await entry.fetch(req('save',{text:'Temporary note'}),env);
 response=await entry.fetch(req('clear'),env);
 assert.equal((await response.json()).cleared,true);
 assert.equal(rows.length,0);
 response=await entry.fetch(req('status'),{NOVA_PASSCODE:env.NOVA_PASSCODE});
 assert.equal(response.status,503,'Missing D1 binding must be explicit');
 console.log('NOVA D1 cloud memory: opt-in UI, authenticated save/search/list/delete, source and origin security PASSED');
}
run().catch(error=>{console.error(error);process.exitCode=1});
