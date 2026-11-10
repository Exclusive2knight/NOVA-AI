/* Validate opt-in Cloudflare deployment without making provider API calls. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/nova-deploy-cloudflare.yml'),'utf8');
const script=path.join(root,'.github/scripts/nova_make_wrangler.cjs');
const generated=path.join(root,'wrangler.ci.json');
assert(workflow.includes('workflow_run:'),'Deploy after verification workflow must be supported');
assert(workflow.includes('github.event.workflow_run.conclusion == \'success\''),'Deploy only when CI passes');
assert(workflow.includes('github.event.workflow_run.event == \'push\''),'Never deploy from pull requests');
assert(workflow.includes("vars.NOVA_AUTO_DEPLOY == 'true'"),'Auto-deployment must be opt-in');
assert(workflow.includes("github.ref == 'refs/heads/main'"),'Manual deployment restricted to main');
assert(workflow.includes('secrets.CLOUDFLARE_API_TOKEN'),'Cloudflare token must come from a GitHub secret');
assert(workflow.includes('secrets.CLOUDFLARE_ACCOUNT_ID'),'Cloudflare account ID must come from a GitHub secret');
assert(workflow.includes('secrets.NOVA_D1_DATABASE_ID'),'D1 ID must come from a GitHub secret');
assert(workflow.includes('cloudflare/wrangler-action@v4'),'Use official Wrangler GitHub Action');
assert(workflow.includes('node tests/nova_smoke.cjs'),'Deployment must recheck code before publishing');
assert(workflow.includes('command: deploy --config wrangler.ci.json'),'Deploy with generated config');
assert(fs.readFileSync(path.join(root,'.gitignore'),'utf8').includes('wrangler.ci.json'),
 'Generated configuration must not be committed');
const sample='123e4567-e89b-12d3-a456-426614174000';
try{
  const output=execFileSync(process.execPath,[script],{
    cwd:root,
    env:{...process.env,NOVA_D1_DATABASE_ID:sample},
    encoding:'utf8'
  });
  assert(output.includes('Prepared a deployment-only Wrangler config'));
  const config=JSON.parse(fs.readFileSync(generated,'utf8'));
  assert.equal(config.name,'nova-ai');
  assert.equal(config.main,'cloudflare/NOVA_3_Phone_Deploy_Worker.js');
  assert.equal(config.ai.binding,'AI');
  assert.equal(config.d1_databases.length,1);
  assert.deepEqual(config.d1_databases[0],{
    binding:'NOVA_MEMORY',database_name:'nova-memory',database_id:sample,
    migrations_dir:'cloudflare/migrations'
  });
}finally{try{fs.unlinkSync(generated)}catch{}}
let rejected=false;
try{
 execFileSync(process.execPath,[script],{
   cwd:root,env:{...process.env,NOVA_D1_DATABASE_ID:'placeholder-not-an-id'},
   stdio:'pipe'});
}catch(error){rejected=error.status!==0}
assert(rejected,'Invalid D1 IDs must be refused');
console.log('NOVA Cloudflare deployment workflow: gated automatic release, secret-only configuration, D1 and AI bindings PASSED');
