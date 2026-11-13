/* No network. Verifies that AutoLab cannot promote on regressions and that
 * round-trip weight packaging is valid. Real rounds are run by GitHub Actions.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const moduleUnderTest=require('../training/autonomous_native_round.cjs');
const root=path.resolve(__dirname,'..');
const p=path.join(root,'training/autonomous_native_round.cjs');
const code=fs.readFileSync(p,'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/nova-autonomous-learning.yml'),'utf8');
const {gate,compress}=moduleUnderTest;
const first=[{suite:'first',total:20,correct:18,meanPenalty:.30,confidentErrors:0},{suite:'second',total:20,correct:16,meanPenalty:.40,confidentErrors:1}];
const good=[{suite:'first',total:20,correct:19,meanPenalty:.20,confidentErrors:0},{suite:'second',total:20,correct:16,meanPenalty:.39,confidentErrors:1}];
const bad=[{suite:'first',total:20,correct:19,meanPenalty:.20,confidentErrors:0},{suite:'second',total:20,correct:15,meanPenalty:.42,confidentErrors:2}];
assert(gate(first,good).promote,'New checkpoint should pass when metrics clearly improve');
assert(!gate(first,bad).promote,'New checkpoint must not promote after accuracy regression');
assert(!gate(first,first).promote,'No change is not an improvement');
const forgettingBefore=[{suite:'forget',total:3,correct:2,meanPenalty:.5,confidentErrors:0,correctMask:[true,true,false]}];
const forgettingAfter=[{suite:'forget',total:3,correct:2,meanPenalty:.3,confidentErrors:0,correctMask:[true,false,true]}];
assert(!gate(forgettingBefore,forgettingAfter).promote,'Previously correct example must not be forgotten even when average score improves');
const encoded=compress([0,1,-1,.25]);
assert.equal(encoded.count,4);
assert.equal(Buffer.from(encoded.data,'base64').length,8);
for(const token of ['native_holdout_v2.json','native_holdout_extra.json','await model.train()',
 'verifiedQuantized','quantizedGate','getItem','heldoutWarning','userChatsCollected:false',
 'window.NOVA_NATIVE_BUNDLE','startedEpochs']){
 assert(code.includes(token),'Missing gate or safety feature '+token);
}
for(const token of ['schedule:','workflow_dispatch:','concurrency:','timeout-minutes:',
 'node training/autonomous_native_round.cjs --apply','node tests/nova_native_checkpoint.cjs',
 'upload-artifact@v4','git push origin HEAD:main','contents: write']){
 assert(workflow.includes(token),'Missing scheduled training guard: '+token);
}
assert(!/curl|wget|openai\.com|anthropic\.com/.test(code),'Training must not scrape or call model APIs');
console.log('NOVA AutoLab promotion, confidence gate, checkpoint packing and schedule: PASSED');
