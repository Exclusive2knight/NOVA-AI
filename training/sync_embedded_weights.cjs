/* Keep Cloudflare single-file Worker in sync with published NOVA Native checkpoint.
 * No network or third-party tools. All other embedded assets remain untouched.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const workerFile=path.join(root,'cloudflare/NOVA_3_Phone_Deploy_Worker.js');
const weights=fs.readFileSync(path.join(root,'nova-native-weights.js'),'utf8');
const source=fs.readFileSync(workerFile,'utf8');
const lines=source.split('\n');
const prefix='const EMBEDDED_ASSETS = ';
if(!lines[1]?.startsWith(prefix)||!lines[1].endsWith(';'))throw Error('Unexpected Worker embedded asset format; refuse to overwrite');
const assets=JSON.parse(lines[1].slice(prefix.length,-1));
if(typeof assets['/nova-native-weights.js']!=='string'||typeof assets['/index.html']!=='string')
 throw Error('Required Cloudflare assets are missing');
if(assets['/nova-native-weights.js']===weights){
 console.log('Cloudflare bundled NOVA Native checkpoint already synchronized');
 process.exit(0);
}
assets['/nova-native-weights.js']=weights;
lines[1]=prefix+JSON.stringify(assets)+';';
fs.writeFileSync(workerFile,lines.join('\n'),'utf8');
console.log('Updated standalone Cloudflare Worker with verified neural weights');
