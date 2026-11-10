/* NOVA sandbox preview diagnostics and safe repair workflow tests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const left=html.indexOf('let previewErrors=[];');
const right=html.indexOf('function refreshArtifactPreview()',left);
assert(left>0&&right>left,'Preview diagnostics implementation must be present');
const snippet=html.slice(left,right);
const handlers={};
const artifactFrame={contentWindow:{}},previewFrame={contentWindow:{}};
const artifactDiagnostics={textContent:''};
const elements={artifactFrame,previewFrame,artifactDiagnostics};
const sandboxWindow={addEventListener(name,fn){handlers[name]=fn}};
const api=new Function('window','$',snippet+'\nreturn {instrumentPreview,artifactDocument}')(sandboxWindow,id=>elements[id]);
const source='<!doctype html><html><head><title>Test</title></head><body><script src="main.js"></script></body></html>';
const preview=api.artifactDocument({'index.html':source,'main.js':'throw new Error("test runtime error");'});
assert(preview.includes('NOVA_PREVIEW_ERROR'),'Preview must include error collection');
assert(preview.indexOf('NOVA_PREVIEW_ERROR')<preview.indexOf('throw new Error'),
 'Error handler must register before project scripts');
assert(!preview.includes('src="main.js"'),'Sandbox preview should inline uploaded JavaScript');
assert(html.includes('id="artifactFrame" title="NOVA artifact preview" sandbox="allow-scripts"'),
 'Iframe sandbox permissions must not be relaxed');
assert(html.includes('id="artifactFixErrors"'),'Missing user-controlled error repair button');
assert(html.includes("Repair prompt prepared · Review it, then press Send"),'Repair must require user review');
assert(handlers.message,'Diagnostics receiver missing');
handlers.message({source:{},data:{type:'NOVA_PREVIEW_ERROR',message:'Spoofed message'}});
assert.equal(artifactDiagnostics.textContent,'','Unrelated iframe must not write diagnostics');
handlers.message({source:artifactFrame.contentWindow,data:{type:'NOVA_PREVIEW_ERROR',message:'Example bug'}});
assert(artifactDiagnostics.textContent.includes('Example bug'));
handlers.message({source:artifactFrame.contentWindow,data:{type:'NOVA_PREVIEW_ERROR',message:'Example bug'}});
assert.equal(artifactDiagnostics.textContent.match(/Example bug/g).length,1,'Deduplicate identical errors');
console.log('NOVA isolated preview diagnostics and user-approved repair tests PASSED');
