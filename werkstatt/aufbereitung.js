// Vehicle detailing on the RAM: wet, foam, rinse, polish.
// The car carries a per-vertex "care" state (dirt, wet, foam, polish) that a finger paints onto,
// and the paint shader blends dirt, water sheen, snow foam and mirror gloss from it.
export function setupDetailing({THREE,camera,renderer,scene,car,floorY,onEnter,onExit,onTrophy}){
 const TOOLS=[
  {id:'wet',name:'Nass machen',icon:'💧',hint:'Mit dem Finger übers Auto wischen und alles nass machen.'},
  {id:'foam',name:'Aufschäumen',icon:'🫧',hint:'Schaum drauf, er löst den Dreck.'},
  {id:'rinse',name:'Abspülen',icon:'🚿',hint:'Schaum und Dreck runterspülen.'},
  {id:'polish',name:'Polieren',icon:'✨',hint:'Mit der Poliermaschine auf Hochglanz bringen.'}];
 const NEED=.85;

 // ---------- per-vertex state ----------
 const meshes=[];car.updateMatrixWorld(true);
 car.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,n=g.attributes.position.count;
  const care=new THREE.BufferAttribute(new Float32Array(n*4),4);care.setUsage(THREE.DynamicDrawUsage);g.setAttribute('care',care);
  const wp=new Float32Array(n*3),reach=new Uint8Array(n),loose=new Float32Array(n),v=new THREE.Vector3(),nm=new THREE.Vector3(),nMat=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
  for(let i=0;i<n;i++){v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(o.matrixWorld);wp.set([v.x,v.y,v.z],i*3);
   nm.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nMat).normalize();reach[i]=(nm.y>-.35&&v.y>floorY+.28)?1:0}
  meshes.push({mesh:o,care,wp,reach,loose,n});patchMaterial(o)});
 const reachable=meshes.reduce((a,m)=>a+m.reach.reduce((x,y)=>x+y,0),0)||1;
 const box=new THREE.Box3().setFromObject(car),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());

 function dirtFromDays(){let last=0;try{last=+localStorage.getItem('rr_lastwash')||0}catch{}const days=(Date.now()-last)/864e5;return last?Math.min(1,Math.max(.45,days/3)):1}
 function makeDirty(level=dirtFromDays()){for(const m of meshes){const a=m.care.array;for(let i=0;i<m.n;i++){const y=m.wp[i*3+1],low=1-Math.min(1,(y-floorY)/1.6);
  const noise=.5+.5*Math.sin(m.wp[i*3]*3.1+m.wp[i*3+2]*2.3)*Math.cos(m.wp[i*3+2]*4.7);a[i*4]=Math.min(1,level*(.55+.45*low)*(.75+.35*noise));a[i*4+1]=0;a[i*4+2]=0;a[i*4+3]=0;m.loose[i]=0}m.care.needsUpdate=true}}
 makeDirty();

 // ---------- paint shader ----------
 function patchMaterial(mesh){const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  mesh.material=mats.map(m0=>{const m=m0.clone();m.envMapIntensity=1.3;
   m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 care;\nvarying vec4 vCare;\nvarying vec3 vWp;')
     .replace('#include <begin_vertex>','#include <begin_vertex>\nvCare=care;\nvWp=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
     varying vec4 vCare;varying vec3 vWp;
     float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
     float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}`)
     .replace('#include <map_fragment>',`#include <map_fragment>
     float nA=n3(vWp*7.),nB=n3(vWp*23.+3.),nC=n3(vWp*55.);
     float dirt=clamp(vCare.x*(.55+.6*nA)-.05,0.,.9);
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.33,.27,.2)*(.75+.4*nB),dirt);
     diffuseColor.rgb*=1.-.28*vCare.y*(1.-vCare.z);
     float foam=smoothstep(.25,.75,vCare.z*(.55+.7*nA)+(nC-.5)*.25);
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.97,1.)*(.92+.08*nB),foam);`)
     .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
     roughnessFactor=mix(roughnessFactor,.9,dirt*.85);
     roughnessFactor=mix(roughnessFactor,.08,vCare.y*.8*(1.-foam));
     roughnessFactor=mix(roughnessFactor,.55,foam);
     roughnessFactor=mix(roughnessFactor,.04,vCare.w*(1.-dirt));`)};
   m.customProgramCacheKey=()=>'ram-care';return m});
  if(mesh.material.length===1)mesh.material=mesh.material[0]}

 // ---------- spray particles, polisher ----------
 const MAXP=500,pPos=new Float32Array(MAXP*3),pVel=new Float32Array(MAXP*3),pLife=new Float32Array(MAXP).fill(-1);
 const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
 const dropTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
 const pMat=new THREE.PointsMaterial({size:.05,map:dropTex,transparent:true,depthWrite:false,color:0xcfe9ff});
 const points=new THREE.Points(pGeo,pMat);points.frustumCulled=false;points.visible=false;scene.add(points);
 const pad=new THREE.Group();const padDisc=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.05,32),new THREE.MeshStandardMaterial({color:0xf07828,roughness:.9}));
 const padBody=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.16,20),new THREE.MeshStandardMaterial({color:0x2b2f33,roughness:.4,metalness:.4}));padBody.position.y=.1;pad.add(padDisc,padBody);pad.visible=false;scene.add(pad);
 function spawn(from,to,tool,count){for(let k=0;k<count;k++){let i=pLife.findIndex(l=>l<0);if(i<0)return;
  const dir=to.clone().sub(from);const len=dir.length();dir.normalize();const spread=tool==='foam'?.12:.05;
  dir.x+=(Math.random()-.5)*spread;dir.y+=(Math.random()-.5)*spread;dir.z+=(Math.random()-.5)*spread;
  const speed=(tool==='foam'?6:11)*(.85+Math.random()*.3);pPos.set([from.x,from.y,from.z],i*3);pVel.set([dir.x*speed,dir.y*speed,dir.z*speed],i*3);pLife[i]=Math.min(1.2,len/speed+.25)}}

 // ---------- sound ----------
 let actx,hiss,hissGain,motor,motorGain;
 function audio(){if(actx)return;try{actx=new (window.AudioContext||window.webkitAudioContext)();const b=actx.createBuffer(1,actx.sampleRate*2,actx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  hiss=actx.createBufferSource();hiss.buffer=b;hiss.loop=true;const f=actx.createBiquadFilter();f.type='bandpass';f.frequency.value=2600;f.Q.value=.6;hissGain=actx.createGain();hissGain.gain.value=0;hiss.connect(f).connect(hissGain).connect(actx.destination);hiss.start();
  motor=actx.createOscillator();motor.type='sawtooth';motor.frequency.value=95;const mf=actx.createBiquadFilter();mf.type='lowpass';mf.frequency.value=500;motorGain=actx.createGain();motorGain.gain.value=0;motor.connect(mf).connect(motorGain).connect(actx.destination);motor.start()}catch{}}
 function sound(tool,on){if(!actx)return;const t=actx.currentTime;actx.resume();
  hissGain.gain.setTargetAtTime(on&&tool!=='polish'?(tool==='foam'?.08:.13):0,t,.05);motorGain.gain.setTargetAtTime(on&&tool==='polish'?.05:0,t,.05)}

 // ---------- UI ----------
 const css=`#rrDet{position:fixed;inset:0;z-index:25;pointer-events:none;display:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#f3ebdf}
 #rrDet.on{display:block}#rrDet .top{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;padding:calc(env(safe-area-inset-top) + 12px) 14px 0}
 #rrDet h3{margin:0;font-size:15px;letter-spacing:.12em;text-shadow:0 2px 10px #000}
 #rrDet .x{pointer-events:auto;border:1px solid #f3ce9e;background:linear-gradient(130deg,#e6b780,#a66e40);color:#1b1411;border-radius:20px;padding:9px 14px;font-weight:800;font-size:12px}
 #rrDet .hint{position:absolute;left:14px;right:14px;top:calc(env(safe-area-inset-top) + 58px);text-align:center;font-size:13px;text-shadow:0 2px 8px #000}
 #rrDet .tools{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 14px);display:flex;gap:7px;justify-content:center}
 #rrDet .t{pointer-events:auto;flex:1;max-width:92px;border-radius:16px;border:1px solid #ffffff40;background:#10161cd0;color:#fff;padding:8px 4px 7px;font-size:11px;font-weight:800;display:flex;flex-direction:column;align-items:center;gap:4px;backdrop-filter:blur(8px)}
 #rrDet .t b{font-size:22px;line-height:1}#rrDet .t.on{background:#f07828;border-color:#ffb27a}#rrDet .t.lock{opacity:.4}
 #rrDet .t i{display:block;width:80%;height:4px;border-radius:3px;background:#ffffff30;overflow:hidden}#rrDet .t i u{display:block;height:100%;width:0;background:#7ddc8b}
 #rrDet .t.done b::after{content:' ✓';font-size:13px}
 #rrDet .win{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);background:#141b20ee;border:1px solid #f3ce9e;border-radius:22px;padding:20px;text-align:center;pointer-events:auto;display:none;width:min(320px,86vw)}
 #rrDet .win.on{display:block}#rrDet .win h2{margin:0 0 6px}#rrDet .win button{margin:6px 4px 0;border:1px solid #f3ce9e;background:linear-gradient(130deg,#e6b780,#a66e40);color:#1b1411;border-radius:16px;padding:10px 14px;font-weight:800}`;
 document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));
 const ui=document.createElement('div');ui.id='rrDet';ui.innerHTML=`<div class="top"><h3>FAHRZEUGAUFBEREITUNG</h3><button class="x">FERTIG</button></div><div class="hint"></div>
  <div class="tools">${TOOLS.map((t,i)=>`<button class="t" data-i="${i}"><b>${t.icon}</b>${t.name}<i><u></u></i></button>`).join('')}</div>
  <div class="win"><h2>Spiegelglanz! ✨</h2><p>Der RAM glänzt wie neu.</p><button class="again">Nochmal dreckig machen</button><button class="out">Zurück in die Werkstatt</button></div>`;
 document.body.appendChild(ui);
 let active=false,tool=0,progress=[0,0,0,0],theta=-.6,phi=.42,radius=6.2,painting=null,orbit=null,hit=null,lastProgT=0,celebrated=false;
 const btns=[...ui.querySelectorAll('.t')];
 function refreshUI(){btns.forEach((b,i)=>{b.classList.toggle('on',i===tool);b.classList.toggle('lock',i>0&&progress[i-1]<NEED);b.classList.toggle('done',progress[i]>=NEED);b.querySelector('u').style.width=Math.min(100,progress[i]/NEED*100)+'%'});
  ui.querySelector('.hint').textContent=tool<4?TOOLS[tool].hint+(progress[tool]>=NEED&&tool<3?' Fertig, weiter mit '+TOOLS[tool+1].name+'!':''):''}
 btns.forEach((b,i)=>b.onclick=()=>{if(i>0&&progress[i-1]<NEED){ui.querySelector('.hint').textContent='Erst '+TOOLS[i-1].name+' fertig machen.';return}tool=i;refreshUI()});
 ui.querySelector('.x').onclick=()=>exit();ui.querySelector('.out').onclick=()=>exit();
 ui.querySelector('.again').onclick=()=>{makeDirty(1);progress=[0,0,0,0];tool=0;celebrated=false;ui.querySelector('.win').classList.remove('on');refreshUI()};

 function computeProgress(){const c=[0,0,0,0];for(const m of meshes){const a=m.care.array;for(let i=0;i<m.n;i++){if(!m.reach[i])continue;const d=a[i*4],w=a[i*4+1],f=a[i*4+2],p=a[i*4+3];
  if(w>.55||m.loose[i]>.5||d<.12)c[0]++;if(m.loose[i]>.5||d<.12)c[1]++;if(d<.12&&f<.2)c[2]++;if(p>.6&&d<.12)c[3]++}}progress=c.map(x=>x/reachable);
  while(tool<3&&progress[tool]>=NEED&&progress[tool+1]<NEED&&!painting)tool++;
  if(progress[3]>=NEED&&!celebrated){celebrated=true;try{localStorage.setItem('rr_lastwash',Date.now())}catch{}onTrophy?.('aufbereitung','Spiegelglanz: RAM komplett aufbereitet');setTimeout(()=>ui.querySelector('.win').classList.add('on'),500)}
  refreshUI()}

 // ---------- input ----------
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),meshList=meshes.map(m=>m.mesh);
 function pick(e){const r=renderer.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);return ray.intersectObjects(meshList,false)[0]||null}
 const el=renderer.domElement;
 el.addEventListener('pointerdown',e=>{if(!active)return;audio();const h=pick(e);if(h&&!(tool>0&&progress[tool-1]<NEED)){painting={id:e.pointerId};hit=h;sound(TOOLS[tool].id,true)}else orbit={id:e.pointerId,x:e.clientX,y:e.clientY}},true);
 el.addEventListener('pointermove',e=>{if(!active)return;if(painting&&painting.id===e.pointerId){hit=pick(e);sound(TOOLS[tool].id,!!hit)}
  else if(orbit&&orbit.id===e.pointerId){theta-=(e.clientX-orbit.x)*.008;phi=Math.min(1.15,Math.max(.12,phi+(e.clientY-orbit.y)*.005));orbit.x=e.clientX;orbit.y=e.clientY}},true);
 const up=e=>{if(!active)return;if(painting&&painting.id===e.pointerId){painting=null;hit=null;sound(null,false);computeProgress()}if(orbit&&orbit.id===e.pointerId)orbit=null};
 el.addEventListener('pointerup',up,true);el.addEventListener('pointercancel',up,true);
 el.addEventListener('wheel',e=>{if(active)radius=Math.min(9,Math.max(4,radius+e.deltaY*.004))},{passive:true});

 function applyBrush(dt){if(!hit)return;const id=TOOLS[tool].id,p=hit.point,R=id==='polish'?.42:.62,R2=R*R,k=dt*(id==='polish'?1.6:2.6);
  for(const m of meshes){const a=m.care.array,w=m.wp;let touched=false;
   for(let i=0;i<m.n;i++){const dx=w[i*3]-p.x,dy=w[i*3+1]-p.y,dz=w[i*3+2]-p.z,d2=dx*dx+dy*dy+dz*dz;if(d2>R2)continue;const s=k*(1-d2/R2),j=i*4;touched=true;
    if(id==='wet'){a[j+1]=Math.min(1,a[j+1]+s*1.4)}
    else if(id==='foam'){a[j+2]=Math.min(1,a[j+2]+s*(a[j+1]>.3?1.3:.5));if(a[j+2]>.55)m.loose[i]=1}
    else if(id==='rinse'){a[j+1]=1;a[j+2]=Math.max(0,a[j+2]-s*1.6);a[j]=Math.max(0,a[j]-s*(m.loose[i]?1.5:.25))}
    else if(id==='polish'){if(a[j]<.15){a[j+3]=Math.min(1,a[j+3]+s);a[j+1]=Math.max(0,a[j+1]-s*1.5)}}}
   if(touched)m.care.needsUpdate=true}}

 // ---------- loop hooks ----------
 const tmp=new THREE.Vector3();
 function update(dt){
  const target=center.clone();target.y=floorY+size.y*.45;
  camera.position.set(target.x+Math.sin(theta)*Math.cos(phi)*radius,target.y+Math.sin(phi)*radius,target.z+Math.cos(theta)*Math.cos(phi)*radius);camera.lookAt(target);
  const id=TOOLS[tool].id;
  if(painting&&hit){applyBrush(dt);
   if(id==='polish'){pad.visible=true;pad.position.copy(hit.point).addScaledVector(hit.face?tmp.copy(hit.face.normal).transformDirection(hit.object.matrixWorld):tmp.set(0,1,0),.04);pad.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tmp);padDisc.rotation.y+=dt*40}
   else{pad.visible=false;const nozzle=camera.position.clone().add(new THREE.Vector3(.35,-.5,-.6).applyQuaternion(camera.quaternion));spawn(nozzle,hit.point,id,id==='foam'?6:10);points.visible=true;pMat.color.set(id==='foam'?0xffffff:0xcfe9ff);pMat.size=id==='foam'?.11:.045}
   lastProgT+=dt;if(lastProgT>.4){lastProgT=0;computeProgress()}}
  else pad.visible=false;
  let alive=false;for(let i=0;i<MAXP;i++){if(pLife[i]<0)continue;alive=true;pLife[i]-=dt;pVel[i*3+1]-=9.8*dt*.5;pPos[i*3]+=pVel[i*3]*dt;pPos[i*3+1]+=pVel[i*3+1]*dt;pPos[i*3+2]+=pVel[i*3+2]*dt;if(pLife[i]<=0||pPos[i*3+1]<floorY){pLife[i]=-1;pPos[i*3+1]=-99}}
  pGeo.attributes.position.needsUpdate=true;if(!alive)points.visible=false}
 function enter(){radius=innerWidth<innerHeight?8.6:6.4;phi=.4;active=true;window.__detailing=true;ui.classList.add('on');theta=Math.atan2(camera.position.x-center.x,camera.position.z-center.z);computeProgress();onEnter?.()}
 function exit(){active=false;window.__detailing=false;ui.classList.remove('on');ui.querySelector('.win').classList.remove('on');painting=null;orbit=null;sound(null,false);pad.visible=false;onExit?.()}
 // test helper: apply one tool to the whole car
 function __fill(t){tool=t;for(const m of meshes)for(let i=0;i<m.n;i++){hit={point:new THREE.Vector3(m.wp[i*3],m.wp[i*3+1],m.wp[i*3+2])};}hit=null;const id=TOOLS[t].id;for(const m of meshes){const a=m.care.array;for(let i=0;i<m.n;i++){const j=i*4;if(id==='wet')a[j+1]=1;if(id==='foam'){a[j+2]=1;m.loose[i]=1}if(id==='rinse'){a[j+2]=0;if(m.loose[i])a[j]=0}if(id==='polish'&&a[j]<.15){a[j+3]=1;a[j+1]=0}}m.care.needsUpdate=true}computeProgress()}
 return{enter,exit,update,get active(){return active},__state:()=>({tool,progress:progress.map(x=>+x.toFixed(2))}),__fill};
}
