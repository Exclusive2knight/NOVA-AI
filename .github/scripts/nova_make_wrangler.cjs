/* Generate a deployment-only Wrangler config without committing Cloudflare IDs.
 * Requires NOVA_D1_DATABASE_ID in the GitHub Actions environment.
 * Existing wrangler.jsonc remains the canonical checked-in configuration.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const configPath=path.join(root,'wrangler.jsonc');
const outputPath=path.join(root,'wrangler.ci.json');
const id=String(process.env.NOVA_D1_DATABASE_ID||'').trim();
if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)){
 console.error('NOVA_D1_DATABASE_ID is missing or invalid. See GitHub Actions deployment guide.');
 process.exit(1);
}
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
if(config.name!=='nova-ai'||config.ai?.binding!=='AI'){
 console.error('Unexpected Wrangler configuration. Refusing to change Worker or AI binding.');
 process.exit(1);
}
config.d1_databases=[{
 binding:'NOVA_MEMORY',
 database_name:'nova-memory',
 database_id:id,
 migrations_dir:'cloudflare/migrations'
}];
fs.writeFileSync(outputPath,JSON.stringify(config,null,2)+'\n',{mode:0o600});
console.log('Prepared a deployment-only Wrangler config for nova-ai with AI and NOVA_MEMORY bindings.');
