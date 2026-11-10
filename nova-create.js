/* NOVA Create: image request helper, prompt routing, JPEG export and
 * simple schematic preview for user-owned procedural GLB files.
 * The only outbound call is the authorized NOVA Worker /api/image route.
 */
(function(root){
'use strict';
function route(text){
 const q=String(text||'').trim();
 if(/^(?:please\s+)?(?:make|generate|create|build|export)\b[\s\S]{0,120}\b(?:glb|gltf|3d model|3d asset)\b/i.test(q)||
    /^(?:glb|3d model)\s+(?:of|for|a|an)\b/i.test(q))return 'glb';
 if(/^(?:please\s+)?(?:make|generate|create|draw|render|design)\b[\s\S]{0,100}\b(?:image|picture|photo|pic|wallpaper|concept art|illustration)\b/i.test(q)||
    /^(?:picture|image|illustration)\s+of\b/i.test(q))return 'image';
 return null;
}
async function generateImage(url,passcode,options,signal){
 const prompt=String(options?.prompt||'').trim();
 if(!prompt||prompt.length>1800)throw Error('Describe an image in 1–1,800 characters.');
 const endpoint=String(url||'').replace(/\/$/,'')+'/api/image';
 const response=await fetch(endpoint,{method:'POST',headers:{
  'Content-Type':'application/json','X-NOVA-Passcode':String(passcode||'')
 },body:JSON.stringify({prompt,style:options.style||'realistic',ratio:options.ratio||'square'}),signal,cache:'no-store'});
 let data={};try{data=await response.json()}catch{}
 if(!response.ok)throw Error(data.error||'Cloudflare image generator is not connected ('+response.status+').');
 if(typeof data.image!=='string'||!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(data.image))
  throw Error('The image service did not return a valid JPEG.');
 return data;
}
async function cropJPEG(image,ratio='square'){
 if(!['square','wide','portrait'].includes(ratio))ratio='square';
 const input=new Image();input.decoding='async';
 await new Promise((ok,no)=>{input.onload=ok;input.onerror=()=>no(Error('Could not open generated image'));input.src=image});
 const w=input.naturalWidth,h=input.naturalHeight,asp=ratio==='wide'?16/9:ratio==='portrait'?9/16:1;
 let sw=w,sh=h;
 if(w/h>asp)sw=Math.min(w,h*asp);else sh=Math.min(h,w/asp);
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(sw));canvas.height=Math.max(1,Math.round(sh));
 const context=canvas.getContext('2d');if(!context)throw Error('Canvas export is unavailable');
 context.drawImage(input,(w-sw)/2,(h-sh)/2,sw,sh,0,0,canvas.width,canvas.height);
 return canvas.toDataURL('image/jpeg',.91);
}
function dataToBytes(uri){
 if(!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(uri))throw Error('Unsupported image format');
 const b=atob(uri.slice(uri.indexOf(',')+1)),out=new Uint8Array(b.length);
 for(let i=0;i<b.length;i++)out[i]=b.charCodeAt(i);
 return out;
}
function hexRGB(hex){
 const v=String(hex||'#789aba').replace('#','');
 return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)||0);
}
function shade(c,t){return 'rgb('+c.map(v=>Math.max(0,Math.min(255,Math.round(v*t)))).join(',')+')'}
function rotate(v,q){
 if(!q)return v;
 const [x,y,z,w]=q,[vx,vy,vz]=v;
 const ix=w*vx+y*vz-z*vy,iy=w*vy+z*vx-x*vz,iz=w*vz+x*vy-y*vx,iw=-x*vx-y*vy-z*vz;
 return [ix*w+iw*-x+iy*-z-iz*-y,iy*w+iw*-y+iz*-x-ix*-z,iz*w+iw*-z+ix*-y-iy*-x];
}
// Schematic preview, not a physically precise mesh renderer.
function drawPreview(canvas,scene,yaw=0.72){
 if(!canvas||!scene)return;
 const width=canvas.width=canvas.clientWidth>0?Math.round(canvas.clientWidth*devicePixelRatio):720;
 const height=canvas.height=canvas.clientHeight>0?Math.round(canvas.clientHeight*devicePixelRatio):430;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.fillStyle='#172334';ctx.fillRect(0,0,width,height);
 const parts=scene.parts||[];
 const center=[0,0,0],points=[];
 for(const p of parts){const t=p.translation||[0,0,0],s=p.scale||[1,1,1];for(let i=0;i<3;i++){points.push([t[0]-s[0]/2,t[1]-s[1]/2,t[2]-s[2]/2],[t[0]+s[0]/2,t[1]+s[1]/2,t[2]+s[2]/2])}}
 if(!points.length)return;
 const mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
 for(const p of points)for(let i=0;i<3;i++){mins[i]=Math.min(mins[i],p[i]);maxs[i]=Math.max(maxs[i],p[i])}
 for(let i=0;i<3;i++)center[i]=(mins[i]+maxs[i])/2;
 const elev=.38,cY=Math.cos(yaw),sY=Math.sin(yaw),cE=Math.cos(elev),sE=Math.sin(elev);
 function pr(x){
  const xx=x[0]-center[0],yy=x[1]-center[1],zz=x[2]-center[2];
  const a=xx*cY+zz*sY,b=zz*cY-xx*sY;
  return [a,cE*yy-sE*b,sE*yy+cE*b];
 }
 const out=points.map(pr);
 const minX=Math.min(...out.map(x=>x[0])),maxX=Math.max(...out.map(x=>x[0]));
 const minY=Math.min(...out.map(x=>x[1])),maxY=Math.max(...out.map(x=>x[1]));
 const pixels=.80*Math.min(width/Math.max(.01,maxX-minX),height/Math.max(.01,maxY-minY));
 const projected=v=>{const a=pr(v);return [width/2+pixels*a[0],height/2-pixels*a[1],a[2]]};
 const faces=[],corners=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
 const quads=[[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[0,1,5,4],[3,2,6,7]];
 for(const part of parts){
  const t=part.translation||[0,0,0],s=part.scale||[1,1,1];
  const verts=corners.map(v=>{const r=rotate([v[0]*s[0],v[1]*s[1],v[2]*s[2]],part.rotation);return projected([r[0]+t[0],r[1]+t[1],r[2]+t[2]])});
  const rgb=hexRGB(scene.materials?.[part.material]?.color);
  for(let i=0;i<6;i++){
   const v=quads[i].map(j=>verts[j]);
   const ux=v[1][0]-v[0][0],uy=v[1][1]-v[0][1],vx=v[2][0]-v[0][0],vy=v[2][1]-v[0][1];
   if((ux*vy-uy*vx)<0)continue;
   faces.push({v,depth:v.reduce((s,p)=>s+p[2],0)/4,color:shade(rgb,[.66,.85,.77,.79,.90,1.04][i])});
  }
 }
 faces.sort((a,b)=>a.depth-b.depth);
 for(const f of faces){
  ctx.beginPath();f.v.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));
  ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle='rgba(18,24,35,.42)';ctx.lineWidth=Math.max(1,width/700);ctx.stroke();
 }
 ctx.fillStyle='#d7e7fb';ctx.font=Math.max(14,Math.round(width/40))+'px system-ui';
 ctx.fillText('NOVA GLB starter · schematic view',14,30);
}
root.NOVACreate={route,generateImage,cropJPEG,dataToBytes,drawPreview};
})(typeof window!=='undefined'?window:globalThis);
