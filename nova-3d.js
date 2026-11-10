/* NOVA 3D Studio — offline procedural starter GLB (glTF 2.0) generator.
 * No external dependencies, AI costs, file uploads or untrusted code execution.
 * Produces Blender/Roblox/Unity compatible geometry, not a photogrammetry model.
 */
(function(root){
'use strict';
const te=new TextEncoder();
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function slug(s){return String(s||'model').toLowerCase().replace(/[^a-z0-9 -]/g,'').trim().replace(/\s+/g,'-').slice(0,52)||'nova-model'}
function title(s){return String(s||'NOVA Model').replace(/[\r\n\t]/g,' ').trim().slice(0,90)||'NOVA Model'}
function rgba(hex){let h=hex.replace('#','');return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255,1]}
function colorFromText(s){
 const t=s.toLowerCase();
 const colors=[['orange','#f18c35'],['blue','#2876d4'],['green','#30a77a'],['purple','#9773be'],['red','#d44245'],['yellow','#e8c144'],['pink','#d67ea8'],['white','#e8e9ed'],['silver','#adb4bc'],['gray','#828b99'],['grey','#828b99'],['black','#353c44']];
 for(const [name,hex] of colors)if(new RegExp('\\b'+name+'\\b').test(t))return hex;
 return '#5986b5';
}
function detect(text){
 const t=String(text||'').toLowerCase();
 if(/(?:garage|parking|ramp|helix|car park)/.test(t))return 'garage';
 if(/(?:house|home|building|store|shop|apartment|skyscraper|school|hotel)/.test(t))return 'building';
 if(/(?:human|person|man|woman|child|character|mannequin|npc)/.test(t))return 'character';
 if(/(?:tree|bush|plant|forest)/.test(t))return 'tree';
 if(/(?:car|truck|pickup|suv|sedan|bus|van|vehicle|tesla|toyota|lincoln|ford|chevy|honda|bmw|kia|rivian)/.test(t))return 'vehicle';
 return 'prop';
}
function qz(a){return [0,0,Math.sin(a/2),Math.cos(a/2)]}
function qx(a){return [Math.sin(a/2),0,0,Math.cos(a/2)]}
function geometryBox(){
 const p=[],n=[],idx=[];
 const faces=[
  {p:[[.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]],n:[1,0,0]},
  {p:[[-.5,-.5,.5],[-.5,-.5,-.5],[-.5,.5,-.5],[-.5,.5,.5]],n:[-1,0,0]},
  {p:[[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]],n:[0,1,0]},
  {p:[[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]],n:[0,-1,0]},
  {p:[[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,.5],[.5,.5,.5]],n:[0,0,1]},
  {p:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]],n:[0,0,-1]}
 ];
 for(const f of faces){const base=p.length/3;for(const v of f.p){p.push(...v);n.push(...f.n)}
  idx.push(base,base+1,base+2,base,base+2,base+3)}
 return {p,n,idx};
}
function geometryCylinder(segments=16){
 const p=[],n=[],idx=[];
 for(let i=0;i<segments;i++){
  const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
  const ca=Math.cos(a)*.5,sa=Math.sin(a)*.5,cb=Math.cos(b)*.5,sb=Math.sin(b)*.5;
  let base=p.length/3;
  p.push(ca,-.5,sa, cb,-.5,sb, cb,.5,sb,ca,.5,sa);
  n.push(Math.cos(a),0,Math.sin(a),Math.cos(b),0,Math.sin(b),Math.cos(b),0,Math.sin(b),Math.cos(a),0,Math.sin(a));
  idx.push(base,base+1,base+2,base,base+2,base+3);
  base=p.length/3;p.push(0,.5,0,ca,.5,sa,cb,.5,sb);
  n.push(0,1,0,0,1,0,0,1,0);idx.push(base,base+1,base+2);
  base=p.length/3;p.push(0,-.5,0,cb,-.5,sb,ca,-.5,sa);
  n.push(0,-1,0,0,-1,0,0,-1,0);idx.push(base,base+1,base+2);
 }
 return {p,n,idx};
}
function geometrySphere(lat=8,lon=14){
 const p=[],n=[],idx=[];
 for(let y=0;y<=lat;y++){
  const phi=y*Math.PI/lat;
  for(let x=0;x<=lon;x++){
   const theta=2*Math.PI*x/lon,dx=Math.sin(phi)*Math.cos(theta),dy=Math.cos(phi),dz=Math.sin(phi)*Math.sin(theta);
   p.push(dx*.5,dy*.5,dz*.5);n.push(dx,dy,dz)
  }
 }
 for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){
  const a=y*(lon+1)+x,b=a+lon+1;
  idx.push(a,b,a+1,b,b+1,a+1)
 }
 return {p,n,idx};
}
function makeScene(prompt,opts={}){
 const requested=opts.kind||'auto';const kind=requested==='auto'?detect(prompt):requested;
 if(!['vehicle','building','garage','tree','character','prop'].includes(kind))throw Error('Choose a supported starter asset type.');
 const parts=[],body=colorFromText(prompt),isLow=opts.detail==='low';
 const mat={
  paint:{color:body,metallic:.36,roughness:.38},
  trim:{color:'#242b34',metallic:.05,roughness:.72},
  glass:{color:'#44667e',metallic:.20,roughness:.22},
  highlight:{color:'#e8eff8',metallic:.24,roughness:.42},
  light:{color:'#f6e4b1',metallic:.02,roughness:.25},
  tire:{color:'#171b21',metallic:0,roughness:.95},
  concrete:{color:'#a0a3a5',metallic:0,roughness:.89},
  wood:{color:'#886447',metallic:0,roughness:.83},
  foliage:{color:'#3d9866',metallic:0,roughness:.88},
  skin:{color:'#bb9276',metallic:0,roughness:.86}
 };
 const add=(name,shape,material,pos,size,rotation)=>parts.push({name,shape,material,translation:pos,scale:size,...(rotation?{rotation}:{})});
 const box=(name,mat,pos,size,rot)=>add(name,'box',mat,pos,size,rot);
 const cylinder=(name,mat,pos,size,rot)=>add(name,'cylinder',mat,pos,size,rot);
 const sphere=(name,mat,pos,size)=>add(name,'sphere',mat,pos,size);
 if(kind==='vehicle'){
  const t=prompt.toLowerCase(),bus=/bus|coach/.test(t),pickup=/truck|pickup|f.?150/.test(t),van=/van|minivan/.test(t),sedan=/sedan|model 3|camry|accord/.test(t);
  const w=bus?2.48:pickup?2.11:2.0,L=bus?9.4:pickup?5.45:van?5.06:sedan?4.66:4.82;
  const r=bus?.53:.42, chassisY=bus?1.10:.97,roofY=bus?2.53:van?1.63:1.53;
  box('Chassis', 'trim',[0,chassisY-.23,0],[w*.93,.33,L*.92]);
  box('Painted shell','paint',[0,chassisY,0],[w,.61,L]);
  const wheelZ=bus?L*.34:L*.32;
  for(const side of [-1,1])for(const zi of [-1,1]){
   const z=zi*wheelZ,x=side*(w*.51-.06);
   cylinder('Tire '+side+' '+zi,'tire',[x,r,z],[r*2,.25,r*2],qz(Math.PI/2));
   cylinder('Wheel rim '+side+' '+zi,'highlight',[x+side*.136,r,z],[r*1.17,.035,r*1.17],qz(Math.PI/2));
  }
  if(bus){
   box('Passenger body','paint',[0,2.02,0],[w,2.1,L*.96]);
   box('Window band','glass',[0,2.40,0],[w*1.013,.80,L*.94]);
   box('Roof','paint',[0,3.05,0],[w,.19,L*.96]);
   box('Windshield','glass',[0,2.46,-L*.486],[w*.88,.98,.045]);
  }else if(pickup){
   box('Cab','paint',[0,roofY-.11,-L*.19],[w*.9,.86,L*.43]);
   box('Cab windshield','glass',[0,roofY+.12,-L*.41],[w*.8,.48,.065]);
   box('Cab side glass','glass',[0,roofY+.10,-L*.19],[w*.91,.38,L*.3]);
   box('Cab roof','paint',[0,roofY+.36,-L*.19],[w*.90,.12,L*.42]);
   box('Bed floor','trim',[0,chassisY+.10,L*.25],[w*.84,.13,L*.43]);
   for(const side of [-1,1])box('Bed side '+side,'paint',[side*w*.45,chassisY+.38,L*.25],[.15,.51,L*.46]);
   box('Tailgate','paint',[0,chassisY+.39,L*.48],[w*.85,.52,.12]);
  }else{
   const cabinLength=van?L*.72:L*.56,cabinZ=van?.05:sedan?.16:.03;
   box('Upper cabin','glass',[0,roofY-.16,cabinZ],[w*.82,.65,cabinLength]);
   box('Painted roof','paint',[0,roofY+.20,cabinZ],[w*.80,.13,cabinLength*.91]);
   box('Front windshield','glass',[0,roofY-.13,cabinZ-cabinLength*.49],[w*.75,.48,.055]);
   box('Rear window','glass',[0,roofY-.15,cabinZ+cabinLength*.49],[w*.72,.43,.055]);
  }
  for(const side of [-1,1]){
   box('Front headlight '+side,'light',[side*w*.36,chassisY+.15,-L*.505],[w*.20,.14,.043]);
   box('Rear taillight '+side,'light',[side*w*.36,chassisY+.16,L*.505],[w*.17,.20,.045]);
   box('Mirror '+side,'trim',[side*w*.52,roofY-.35,-L*.22],[.18,.13,.25]);
  }
  box('Front bumper','trim',[0,chassisY-.23,-L*.505],[w*.83,.23,.10]);
  box('Rear bumper','trim',[0,chassisY-.22,L*.505],[w*.84,.21,.10]);
  box('Front grille','trim',[0,chassisY+.08,-L*.511],[w*.5,.26,.045]);
 }else if(kind==='building'){
  const tall=/skyscraper|tower|apartment|hotel|office/.test(prompt.toLowerCase());
  const w=tall?9.5:7.5,L=tall?7.0:6.0,h=tall?13:3.1;
  box('Foundation','concrete',[0,.19,0],[w+.4,.38,L+.35]);
  box('Exterior walls','paint',[0,.38+h/2,0],[w,h,L]);
  if(!tall){
   box('Roof left','trim',[-w*.23,h+.62,0],[w*.61,.25,L+.5],qz(.45));
   box('Roof right','trim',[w*.23,h+.62,0],[w*.61,.25,L+.5],qz(-.45));
  }else box('Flat roof','trim',[0,h+.46,0],[w+.35,.23,L+.4]);
  box('Entrance door','wood',[0,1.47,-L*.51],[1.25,2.2,.065]);
  for(const side of [-1,1]){
   if(tall){for(let y=2.2;y<h;y+=2.5){
    box('Window front '+side+' floor '+y,'glass',[side*w*.28,y,-L*.51],[w*.22,1.25,.06]);
   }}else{
    box('Front window '+side,'glass',[side*w*.29,1.92,-L*.51],[1.6,1.16,.055]);
   }
  }
  box('Front doorstep','concrete',[0,.32,-L*.60],[1.75,.20,.8]);
 }else if(kind==='garage'){
  const w=15.5,L=20.5;
  for(let level=0;level<3;level++){
   const y=.2+level*3.0;
   box('Deck level '+(level+1),'concrete',[0,y,0],[w,.35,L]);
   for(const x of [-w*.44,w*.44])for(const z of [-L*.42,L*.42]){
    if(level<2)box('Support column '+level+' '+x+' '+z,'concrete',[x,y+1.5,z],[.52,3.0,.52]);
   }
   for(const side of [-1,1])box('Side safety wall '+level+' '+side,'concrete',[side*w*.50,y+.55,0],[.28,.80,L]);
  }
  for(let level=0;level<2;level++){
   const low=.2+level*3.0,dir=level%2===0?1:-1;
   for(const side of [-1,1]){
    box('Inclined ramp '+level+' '+side,'concrete',[side*3.65,low+1.49,dir*4.2],[3.2,.29,10.9],qx(dir*.27));
    box('Ramp guardrail '+level+' '+side,'trim',[side*5.32,low+1.97,dir*4.2],[.17,.62,10.8],qx(dir*.27));
   }
   box('Crossover landing '+level,'concrete',[0,low+3.04,-dir*5.82],[10.3,.28,3.2]);
  }
 }else if(kind==='tree'){
  cylinder('Trunk','wood',[0,1.55,0],[.67,3.1,.67]);
  sphere('Lower canopy','foliage',[0,3.13,0],[2.75,2.1,2.65]);
  sphere('Upper canopy','foliage',[0,4.1,0],[2.24,2.08,2.15]);
  if(!isLow)for(const side of [-1,1])sphere('Canopy clump '+side,'foliage',[side*.87,3.57,.35],[1.18,1.45,1.38]);
 }else if(kind==='character'){
  box('Torso','paint',[0,1.46,0],[.69,.87,.38]);
  box('Waist','trim',[0,.99,0],[.61,.18,.35]);
  cylinder('Neck','skin',[0,2.0,0],[.22,.21,.23]);
  sphere('Head','skin',[0,2.3,0],[.46,.56,.43]);
  for(const side of [-1,1]){
   box('Upper arm '+side,'paint',[side*.49,1.49,0],[.22,.75,.24],qz(side*.08));
   box('Hand '+side,'skin',[side*.52,1.02,0],[.15,.21,.17]);
   box('Leg '+side,'trim',[side*.19,.50,0],[.27,.93,.29]);
   box('Shoe '+side,'trim',[side*.19,.13,-.1],[.29,.20,.5]);
  }
 }else{
  const t=prompt.toLowerCase();
  if(/table|desk/.test(t)){
   box('Tabletop','wood',[0,1.04,0],[1.7,.14,.95]);
   for(const x of [-.7,.7])for(const z of [-.35,.35])box('Table leg','trim',[x,.52,z],[.15,1.04,.15]);
  }else if(/chair|seat/.test(t)){
   box('Seat','wood',[0,.60,0],[.86,.15,.84]);
   box('Backrest','wood',[0,1.08,.36],[.86,.96,.12]);
   for(const x of [-.34,.34])for(const z of [-.30,.30])box('Chair leg','trim',[x,.3,z],[.13,.59,.13]);
  }else if(/lamp|street.?light/.test(t)){
   cylinder('Pole','trim',[0,2.0,0],[.16,4.0,.16]);
   box('Lamp fixture','highlight',[.64,3.93,0],[1.4,.2,.36]);
   box('Lamp light','light',[1.03,3.77,0],[.52,.08,.25]);
  }else{
   box('Main body','paint',[0,.67,0],[1.5,1.23,1.0]);
   box('Top trim','trim',[0,1.34,0],[1.45,.16,1.05]);
   box('Front detail','glass',[0,.78,-.53],[.92,.60,.065]);
  }
 }
 if(parts.length>160)throw Error('Model too complex for the mobile starter generator');
 const bounds={width:kind==='vehicle'?2:kind==='garage'?15.5:kind==='building'?7.5:kind==='character'?.9:kind==='tree'?2.75:1.5};
 return {name:title(prompt),kind,parts,materials:mat,bounds,
  notes:'Procedural starter geometry with simple materials; no detailed interiors, textures, UVs, rigs or real-world brand accuracy.'};
}
function writeGLB(scene){
 const geometries=[geometryBox(),geometryCylinder(16),geometrySphere()];
 const names=['box','cylinder','sphere'],chunks=[],views=[],accessors=[];
 let total=0;
 function store(bytes,target){
  const pad=(4-total%4)%4;
  if(pad){chunks.push(new Uint8Array(pad));total+=pad}
  const index=views.length;
  chunks.push(bytes);views.push({buffer:0,byteOffset:total,byteLength:bytes.length,...(target?{target}:{})});
  total+=bytes.length;return index;
 }
 function addAccessor(data,componentType,type,target,count,min,max){
  const bytes=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
  const view=store(bytes,target);
  const idx=accessors.length;
  accessors.push({bufferView:view,componentType,count,type,...(min?{min,max}:{})});return idx;
 }
 const primitives={};
 for(const [i,g] of geometries.entries()){
  const p=new Float32Array(g.p),n=new Float32Array(g.n),indices=new Uint16Array(g.idx);
  primitives[names[i]]={
   attributes:{POSITION:addAccessor(p,5126,'VEC3',34962,p.length/3,[-.5,-.5,-.5],[.5,.5,.5]),NORMAL:addAccessor(n,5126,'VEC3',34962,n.length/3)},
   indices:addAccessor(indices,5123,'SCALAR',34963,indices.length),mode:4
  };
 }
 const materials=Object.entries(scene.materials).map(([name,m])=>({
  name,pbrMetallicRoughness:{baseColorFactor:rgba(m.color),metallicFactor:m.metallic,roughnessFactor:m.roughness},doubleSided:true
 }));
 const matNames=Object.keys(scene.materials);
 const meshes=[],nodes=[];
 for(const part of scene.parts){
  const ix=meshes.length,mat=matNames.indexOf(part.material);
  meshes.push({name:part.name,primitives:[{...primitives[part.shape],material:mat}]});
  nodes.push({name:part.name,mesh:ix,translation:part.translation,scale:part.scale,...(part.rotation?{rotation:part.rotation}:{})});
 }
 const padded=(total+3)&~3;
 if(padded!==total){chunks.push(new Uint8Array(padded-total));total=padded}
 const gltf={asset:{version:'2.0',generator:'NOVA 3D Studio · procedural starter'},
  scene:0,scenes:[{name:scene.name,nodes:nodes.map((_,i)=>i)}],nodes,meshes,materials,
  buffers:[{byteLength:total}],bufferViews:views,accessors,
  extras:{assetType:scene.kind,notes:scene.notes,prompt:scene.name}};
 const jsonBytes=te.encode(JSON.stringify(gltf));
 const jsonLength=(jsonBytes.length+3)&~3;
 const len=12+8+jsonLength+8+total;
 const buffer=new ArrayBuffer(len),dv=new DataView(buffer),out=new Uint8Array(buffer);
 dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,len,true);
 dv.setUint32(12,jsonLength,true);dv.setUint32(16,0x4e4f534a,true);
 out.set(jsonBytes,20);out.fill(0x20,20+jsonBytes.length,20+jsonLength);
 const binAt=20+jsonLength;
 dv.setUint32(binAt,total,true);dv.setUint32(binAt+4,0x004e4942,true);
 let offset=binAt+8;for(const b of chunks){out.set(b,offset);offset+=b.length}
 if(offset!==len)throw Error('GLB data layout mismatch');
 return out;
}
function build(prompt,options={}){
 if(!String(prompt||'').trim())throw Error('Describe the 3D asset to create first.');
 const scene=makeScene(String(prompt).slice(0,1500),options);
 return {scene,bytes:writeGLB(scene),filename:slug(scene.name)+'.glb'};
}
root.NOVA3D={version:'1.0',build,makeScene,writeGLB,detect};
})(typeof window!=='undefined'?window:globalThis);
