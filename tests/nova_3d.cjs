/* NOVA 3D Studio tests: real GLB2 structure, usable scene graph and geometry. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'nova-3d.js'),'utf8');
const scope={};new Function('window',code)(scope);
const gen=scope.NOVA3D;assert(gen&&typeof gen.build==='function');
function parse(bytes){
 const b=Buffer.from(bytes);assert.equal(b.toString('utf8',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);
 assert.equal(b.readUInt32LE(8),b.length,'GLB byte count must match binary header');
 const jlen=b.readUInt32LE(12),jtype=b.toString('utf8',16,20);
 assert.equal(jtype,'JSON');assert.equal(jlen%4,0);
 const json=JSON.parse(b.toString('utf8',20,20+jlen).trim());
 const bo=20+jlen,blen=b.readUInt32LE(bo);
 assert.equal(b.toString('ascii',bo+4,bo+8),'BIN\0');
 assert.equal(bo+8+blen,b.length);
 assert.equal(blen,json.buffers[0].byteLength);
 for(const v of json.bufferViews)assert(v.byteOffset+v.byteLength<=blen);
 for(const a of json.accessors){
  assert(a.bufferView<json.bufferViews.length);
  assert(a.count>0);
 }
 for(const m of json.meshes)for(const p of m.primitives){
  assert.equal(p.mode,4);
  assert(p.attributes.POSITION<json.accessors.length);
  assert(p.indices<json.accessors.length);
  assert(json.accessors[p.indices].count>0);
 }
 assert.equal(json.asset.version,'2.0');
 assert.equal(json.scenes.length,1);
 assert.equal(json.scenes[0].nodes.length,json.nodes.length);
 assert(json.nodes.length>=3);
 return json;
}
const prompts=[
 ['Detailed blue SUV with 4 wheels','vehicle','Tire'],
 ['2024 pickup truck with a large bed','vehicle','Tailgate'],
 ['Modern office building','building','Window'],
 ['Double-helix parking garage with ramps','garage','Inclined ramp'],
 ['Human mannequin character with arms and legs','character','Torso'],
 ['Large forest tree','tree','Canopy'],
 ['Wooden chair for my game','prop','Chair']
];
for(const [prompt,kind,name] of prompts){
 const {scene,bytes,filename}=gen.build(prompt,{kind:'auto'});
 assert.equal(scene.kind,kind,prompt);
 assert(bytes instanceof Uint8Array);assert(bytes.length>2000&&bytes.length<2000000);
 const gltf=parse(bytes);assert(gltf.nodes.some(n=>n.name.includes(name)),prompt);
 assert(filename.endsWith('.glb'));
 assert(gltf.materials.every(m=>m.pbrMetallicRoughness.baseColorFactor.length===4));
}
assert.throws(()=>gen.build(''),/Describe/);
assert.throws(()=>gen.build('A spaceship',{kind:'full-auto-ai'}),/supported starter/);
assert.equal(gen.detect('2019 BMW X5 SUV'),'vehicle');
assert.equal(gen.detect('garage'),'garage');
console.log('NOVA 3D: 7 user prompts create valid glTF 2.0 binary GLB structure with geometry, nodes and PBR materials.');
