/* Deterministic privacy, correction-routing and no-autonomous-training tests. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'nova-learning.js'),'utf8');
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
const win={};
new Function('window',src)(win);
const learn=win.NOVAQuickLearn;
assert(learn,'Turbo learning module failed to initialize');
const topic='Make a realistic parking garage for my driving game';
const positive=[
 'No, I meant a two-bay garage with separate ramps',
 'Actually, it needs two ramps and a crossover',
 'I meant the actual 2019 RAV4 shape',
 'You forgot the large rear window on the model',
 'Instead, use the old Tesla mesh body',
 'That is wrong, it should be landscape',
 'Please do not move the steering wheel near the screen'
];
for(const input of positive)assert(learn.correction(input,topic).includes('user clarified: '+input),'Correction missed: '+input);
const negative=[
 'Thanks, that looks good',
 'What is the current weather?',
 'I wonder how learning works',
 'Forget my data and conversation history',
 'No way that is amazing!',
 'Actually my password is 123456abcdef',
 'Actually, I have a diagnosis to tell you about',
 'Actually, here is my street address',
 'Actually, email me at test@example.com',
 'Actually call 555-888-5555',
 'Actually use account 123456789012'
];
for(const input of negative)assert.equal(learn.correction(input,topic),'','Non-correction/sensitive text saved: '+input);
assert.equal(learn.correction(positive[0],'What is my password and bank account number?'),'');
assert.equal(learn.correction('no',topic),'');
assert.equal(learn.correction(positive[0],''),'');
assert(page.includes('id="turboLearningToggle"'),'Explicit Turbo Learning opt-in is required');
assert(page.includes('state.turboLearningOn'),'Turbo Learning setting must be persistent');
assert(page.includes('const previous=userMessages.length>1?'),'Short-followup cloud recall must use prior request');
assert(page.includes('NOVAQuickLearn?.correction'),'Correction learner not connected to memory');
assert(page.includes('cloudMemoryStoreExchange(promptText,answer.content)'),'Completed responses should learn and store');
console.log('NOVA Turbo Learning: corrections detected, private data rejected, explicit opt-in and chat wiring PASSED');
