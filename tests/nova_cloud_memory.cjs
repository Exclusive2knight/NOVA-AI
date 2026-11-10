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
const rows=[];let cursorSeq=0;
const db={prepare(sql){
 const stmt={
  params:[],
  bind(...values){this.params=values;return this;},
  async first(){if(sql.includes('COUNT(*)'))return {total:rows.length};if(sql.includes('SELECT id FROM nova_memories WHERE id=?'))return rows.find(r=>r.id===this.params[0])||null;if(sql.includes('SELECT id FROM nova_memories WHERE body=?'))return rows.find(r=>r.body===this.params[0])||null;throw Error('Unexpected mock DB first: '+sql)},
  async run(){
   if(sql.startsWith('INSERT INTO nova_memories')){
    const [body,source,created_at,id]=this.params;
    rows.push({body,source,created_at,id,cursor:++cursorSeq});
   }else if(sql==='UPDATE nova_memories SET body=? WHERE id=?'){
    const item=rows.find(r=>r.id===this.params[1]);if(item)item.body=this.params[0];
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
   if(sql.includes('WHERE rowid>? ORDER BY rowid LIMIT 201'))return {results:rows.filter(r=>r.cursor>this.params[0]).slice(0,201).map(r=>({cursor:r.cursor,id:r.id,source:r.source,created_at:r.created_at,text:r.body}))};
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
 // Edit a corrected fact in place and ensure old content is gone.
 const badEdit=await entry.fetch(req('edit',{id:saved.id,text:'My password is 1234'}),env);
 assert.equal(badEdit.status,400);
 const edited=await entry.fetch(req('edit',{id:saved.id,text:'Monarch Q6 has four electric motors and supercharged V6'}),env);
 assert.equal((await edited.json()).updated,true);
 response=await entry.fetch(req('list'),env);
 assert((await response.json()).memories[0].text.includes('four electric motors'));
 // Pagination returns no more than 200 records per response.
 for(let n=0;n<210;n++)rows.push({body:'Project note '+n,source:'note',created_at:String(Date.now()),id:'test-'+n,cursor:++cursorSeq});
 const one=await (await entry.fetch(req('export',{after:0}),env)).json();
 assert.equal(one.memories.length,200);assert(one.next>0);
 const two=await (await entry.fetch(req('export',{after:one.next}),env)).json();
 assert.equal(two.memories.length,11);assert.equal(two.next,null);
 rows.splice(1);
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
 assert(page.includes('id="cloudMemoryExport"'),'Cloud memory export button missing');
 assert(page.includes("cloudMemoryCall('edit'"),'Cloud memory correction UI missing');
 console.log('NOVA D1 cloud memory: authorized save/search/edit/export/delete, pagination and privacy PASSED');
}
run().catch(error=>{console.error(error);process.exitCode=1});
