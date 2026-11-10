/* NOVA project checker 1.0 — deterministic checks, no code execution/network.
 * Designed for small HTML/CSS/JS projects saved in NOVA's browser workspace.
 */
(function(root){
'use strict';
function inspect(files){
 const data=files&&typeof files==='object'?files:{};
 const names=Object.keys(data),issues=[],seen=new Set();
 const add=(severity,file,message)=>{
  const key=severity+'|'+file+'|'+message;
  if(seen.has(key)||issues.length>=80)return;
  seen.add(key);issues.push({severity,file,message});
 };
 const htmlFiles=names.filter(x=>/\.html?$/i.test(x));
 if(!htmlFiles.length)add('error','project','No HTML entry file found. Add index.html to preview your website.');
 for(const filename of htmlFiles){
  const html=String(data[filename]||'');
  const ids=new Set();
  for(const match of html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)){
   const id=match[1];
   if(ids.has(id))add('warning',filename,'Duplicate element id: '+id.slice(0,80));
   else ids.add(id);
  }
  if(!/<html\b/i.test(html))add('warning',filename,'Missing an explicit <html> element');
  if(!/<title\b/i.test(html))add('warning',filename,'No <title> element');
  const references=[
   ...[...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(x=>({url:x[1],kind:'script'})),
   ...[...html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)].filter(x=>/rel\s*=\s*["']stylesheet["']/i.test(x[0])).map(x=>({url:x[1],kind:'stylesheet'}))
  ];
  for(const ref of references){
   const url=ref.url.trim();
   if(/^(?:https?:|data:|blob:|\/\/|#)/i.test(url))continue;
   if(url.includes('..')){add('warning',filename,'Reference uses a parent directory: '+url.slice(0,100));continue}
   const clean=url.split(/[?#]/)[0].replace(/^\.\//,'');
   const base=filename.includes('/')?filename.slice(0,filename.lastIndexOf('/')+1):'';
   const found=Object.hasOwn(data,base+clean)||Object.hasOwn(data,clean);
   if(!found)add('error',filename,'Missing local '+ref.kind+': '+clean.slice(0,110));
  }
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
   if(match[0].includes(' src='))continue;
   const snippet=match[1];
   for(const selector of snippet.matchAll(/\bgetElementById\(\s*["']([^"']+)["']\s*\)/g)){
    const id=selector[1];if(!ids.has(id))add('warning',filename,'JavaScript refers to missing element id: '+id.slice(0,80));
   }
  }
 }
 for(const filename of names.filter(x=>/\.(js|css)$/i.test(x))){
  if(!String(data[filename]||'').trim())add('warning',filename,'This source file is empty');
 }
 return {filesChecked:names.length,errors:issues.filter(x=>x.severity==='error').length,
  warnings:issues.filter(x=>x.severity==='warning').length,issues};
}
root.NOVAProjectCheck={version:'1.0',inspect};
})(typeof window!=='undefined'?window:globalThis);
