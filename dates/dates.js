// Barbie room: date wheel, mailbox and photo album.
// Storage: Supabase when dates/config.js exists (see SUPABASE.md), otherwise only on this phone.
const css=`
.dr-ov{position:fixed;inset:0;z-index:40;display:none;align-items:center;justify-content:center;padding:14px;background:radial-gradient(#ff8cc066,#3b0a24cc);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#5a1838}
.dr-ov.on{display:flex}
.dr-card{position:relative;width:min(440px,100%);max-height:calc(100dvh - 28px);overflow:auto;background:linear-gradient(160deg,#fff6fa,#ffe1ee);border:2px solid #ff9ec7;border-radius:26px;padding:20px 18px;box-shadow:0 20px 60px #7a1b4a66}
.dr-card h2{margin:0 0 4px;font-size:26px;letter-spacing:.04em;color:#e0337f;font-weight:900}
.dr-card p.sub{margin:0 0 12px;font-size:13px;color:#8a4a68}
.dr-x{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;border:0;background:#ffd0e3;color:#c2185b;font-size:18px;font-weight:900}
.dr-btn{border:0;border-radius:18px;padding:12px 16px;font-weight:800;font-size:15px;background:linear-gradient(135deg,#ff5fa2,#e0337f);color:#fff;box-shadow:0 6px 18px #e0337f55}
.dr-btn.alt{background:#fff;color:#e0337f;border:2px solid #ff9ec7;box-shadow:none}
.dr-btn.turq{background:linear-gradient(135deg,#7fe0dc,#3bb8b4)}
.dr-row{display:flex;gap:8px;flex-wrap:wrap}
.dr-tabs{display:flex;gap:6px;margin:6px 0 10px}.dr-tabs button{flex:1;border:2px solid #ff9ec7;background:#fff;color:#e0337f;border-radius:14px;padding:8px;font-weight:800;font-size:13px}.dr-tabs button.on{background:#ff5fa2;color:#fff;border-color:#ff5fa2}
.dr-wheel{position:relative;width:min(300px,78vw);aspect-ratio:1;margin:6px auto 12px}
.dr-wheel canvas{width:100%;height:100%;border-radius:50%;box-shadow:0 0 0 6px #fff,0 0 0 10px #ff9ec7,0 10px 30px #e0337f55}
.dr-ptr{position:absolute;left:50%;top:-14px;transform:translateX(-50%);width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-top:30px solid #3bb8b4;filter:drop-shadow(0 3px 3px #0004)}
.dr-res{background:#fff;border-radius:18px;padding:14px;margin:8px 0;border:2px dashed #ff9ec7;text-align:center}
.dr-res b{display:block;font-size:20px;color:#e0337f;margin-bottom:4px}
.dr-list{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.dr-item{display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:10px 12px;font-size:14px}
.dr-item span{flex:1}.dr-item small{display:block;color:#a06a85}
.dr-item button{border:0;border-radius:12px;padding:8px 10px;font-weight:800;background:#3bb8b4;color:#fff;font-size:12px}
.dr-h3{margin:14px 0 4px;font-size:14px;letter-spacing:.06em;color:#c2185b}
.dr-note{font-size:11px;color:#a06a85;margin-top:12px;text-align:center}
.dr-letter{background:#fff;border-radius:16px;padding:12px;border-left:5px solid #ff5fa2}.dr-letter.me{border-left-color:#3bb8b4}
.dr-letter small{color:#a06a85}.dr-letter p{margin:6px 0 0;white-space:pre-wrap;line-height:1.4}
.dr-letter.new{box-shadow:0 0 0 2px #ff5fa2}
.dr-card textarea{width:100%;min-height:110px;border-radius:16px;border:2px solid #ff9ec7;padding:12px;font:inherit;font-size:15px;resize:vertical;background:#fff}
.dr-card input[type=email],.dr-card input[type=password]{width:100%;border-radius:14px;border:2px solid #ff9ec7;padding:11px;font:inherit;margin-bottom:8px}
.dr-book{background:#fff;border-radius:18px;padding:14px;min-height:280px;box-shadow:inset 0 0 0 1px #ffd0e3}
.dr-cover{display:grid;place-items:center;text-align:center;min-height:280px;background:linear-gradient(140deg,#ff5fa2,#e0337f);color:#fff;border-radius:18px}
.dr-cover b{font-size:30px;font-family:Georgia,serif;font-style:italic}
.dr-photos{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0}.dr-photos img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;border:4px solid #fff;box-shadow:0 3px 10px #e0337f33}
.dr-pager{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-weight:800;font-size:13px}
.dr-pick{display:flex;gap:8px;margin:10px 0}.dr-pick button{flex:1}
.dr-sec{margin:10px 0 4px;font-size:12px;font-weight:900;letter-spacing:.08em;color:#c2185b}
.dr-chips{display:flex;flex-wrap:wrap;gap:6px}
.dr-chip{border:2px solid #ff9ec7;background:#fff;color:#c2185b;border-radius:999px;padding:8px 12px;font-weight:800;font-size:13px}
.dr-chip.on{background:#ff5fa2;border-color:#ff5fa2;color:#fff}
.dr-chip.fix{background:#ffe1ee;border-color:#ffd0e3;color:#c2185b;opacity:.9}
.dr-prog{margin:4px 0 10px}.dr-prog .bar{height:10px;border-radius:6px;background:#ffd0e3;overflow:hidden}.dr-prog .bar i{display:block;height:100%;background:linear-gradient(90deg,#ff5fa2,#3bb8b4)}
.dr-prog b{display:block;font-size:14px;margin-bottom:5px}
.dr-draw{width:100%;margin-top:14px;font-size:17px;padding:15px}
.dr-ticket{background:#fff;border-radius:20px;padding:16px;margin:12px 0;border:2px dashed #ff9ec7;text-align:center;animation:drpop .45s cubic-bezier(.2,1.6,.4,1)}
@keyframes drpop{from{transform:translateY(30px) scale(.8) rotate(-4deg);opacity:0}to{transform:none;opacity:1}}
.dr-ticket b{display:block;font-size:21px;color:#e0337f;margin-bottom:6px}
.dr-tags{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:10px 0 2px}.dr-tags span{background:#ffe1ee;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:800;color:#c2185b}
.dr-empty{background:#fff;border-radius:16px;padding:14px;text-align:center;margin-top:12px;font-size:14px}
.dr-card label.f{display:block;font-size:12px;font-weight:900;letter-spacing:.06em;color:#c2185b;margin:10px 0 4px}
.dr-card input[type=date]{width:100%;border-radius:14px;border:2px solid #ff9ec7;padding:10px;font:inherit;background:#fff}
.dr-mem{background:#fff6fa;border-radius:14px;padding:10px 12px;font-style:italic;line-height:1.45;margin:8px 0}
.dr-thumbs{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.dr-thumbs img{width:64px;height:64px;object-fit:cover;border-radius:10px}
`;
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));

// ---------------- storage ----------------
// A record per date idea: { status: 'geplant' | 'erlebt', erlebt_am, erinnerung, fotos: [urls] }.
const idb=(()=>{let db;const open=()=>db||(db=new Promise((res,rej)=>{const r=indexedDB.open('rr-dates',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
 const tx=async(mode,fn)=>{const d=await open();return new Promise((res,rej)=>{const t=d.transaction('photos',mode);const req=fn(t.objectStore('photos'));t.oncomplete=()=>res(req&&req.result);t.onerror=()=>rej(t.error)})};
 return{put:p=>tx('readwrite',s=>s.put(p)),all:()=>tx('readonly',s=>s.getAll())}})();
const ls={get(k,d){try{return JSON.parse(localStorage.getItem('rr_'+k))??d}catch{return d}},set(k,v){try{localStorage.setItem('rr_'+k,JSON.stringify(v))}catch{}}};

const local={kind:'local',
 async me(){return ls.get('me',null)},async setMe(n){ls.set('me',n)},
 async records(){const r=ls.get('date_records',{});const photos=await idb.all().catch(()=>[]);
  for(const p of photos){(r[p.date_id]??={status:'erlebt'}).fotos=[...(r[p.date_id].fotos||[]),URL.createObjectURL(p.blob)]}return r},
 async plan(id){const r=ls.get('date_records',{});r[id]={status:'geplant'};ls.set('date_records',r)},
 async unplan(id){const r=ls.get('date_records',{});if(r[id]?.status==='geplant')delete r[id];ls.set('date_records',r)},
 async complete(id,{erlebt_am,erinnerung,blobs}){for(const b of blobs)await idb.put({id:id+':'+Date.now()+Math.random(),date_id:id,blob:b});
  const r=ls.get('date_records',{});r[id]={status:'erlebt',erlebt_am,erinnerung};ls.set('date_records',r)},
 async addPhotos(id,blobs){for(const b of blobs)await idb.put({id:id+':'+Date.now()+Math.random(),date_id:id,blob:b})},
 async letters(){return ls.get('letters',[])},
 async sendLetter(von,an,text){const l=ls.get('letters',[]);l.push({id:Date.now()+'',von,an,text,gelesen:false,created_at:new Date().toISOString()});ls.set('letters',l)},
 async markRead(ids){const l=ls.get('letters',[]);l.forEach(x=>{if(ids.includes(x.id))x.gelesen=true});ls.set('letters',l)},
 async roomPhoto(){return null}};

async function supabaseBackend(){
 let cfg;try{cfg=await import('./config.js')}catch{return null}
 // Switch over only once login and tables are confirmed (DATES_READY in config.js); until then data stays on this phone.
 const key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY;if(!cfg.SUPABASE_URL||!key||!cfg.DATES_READY)return null;
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm');
 const sb=createClient(cfg.SUPABASE_URL,key),T=cfg.DATE_IDEAS_TABLE||'ricardo_date_ideas',M=cfg.DATE_MESSAGES_TABLE||'ricardo_date_messages',B=cfg.DATE_PHOTOS_BUCKET||'ricardo-date-photos';
 const name=async()=>{const {data}=await sb.auth.getSession();return data.session?.user?.user_metadata?.name||null};
 // Tell the 3D room when someone logs in or out (photo in the heart frame, progress on the box).
 sb.auth.onAuthStateChange((ev,session)=>{if(ev==='SIGNED_IN'||ev==='SIGNED_OUT'||(ev==='INITIAL_SESSION'&&session))setTimeout(()=>window.dispatchEvent(new CustomEvent('rr-dates-auth',{detail:{loggedIn:!!session}})),0)});
 const signed=async p=>{const {data}=await sb.storage.from(B).createSignedUrl(p,3600);return data?.signedUrl||null};
 const upload=async(id,blobs)=>{const paths=[];for(const b of blobs){const p=`${id}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.jpg`;const up=await sb.storage.from(B).upload(p,b,{contentType:'image/jpeg'});if(up.error)throw up.error;paths.push(p)}return paths};
 const row=async id=>{const {data}=await sb.from(T).select('*').eq('id',id).maybeSingle();return data};
 const save=async(id,v)=>{const {error}=await sb.from(T).upsert({id,...v,updated_by:await name(),updated_at:new Date().toISOString()});if(error)throw error};
 return{kind:'supabase',
  async loggedIn(){const {data}=await sb.auth.getSession();return !!data.session},
  async login(email,pw){const {error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw new Error(error.message==='Invalid login credentials'?'E-Mail oder Passwort stimmt nicht.':error.message)},
  async logout(){await sb.auth.signOut()},
  me:name,async setMe(){},
  async records(){const {data,error}=await sb.from(T).select('id,status,erlebt_am,erinnerung,fotos').not('status','is',null);if(error)throw error;
   const out={};for(const r of data)out[r.id]={status:r.status,erlebt_am:r.erlebt_am,erinnerung:r.erinnerung,fotos:await Promise.all((r.fotos||[]).map(signed))};return out},
  async plan(id){await save(id,{status:'geplant'})},
  async unplan(id){const r=await row(id);if(r?.status==='geplant')await save(id,{status:null})},
  async complete(id,{erlebt_am,erinnerung,blobs}){const fotos=await upload(id,blobs);await save(id,{status:'erlebt',erlebt_am,erinnerung,fotos})},
  async addPhotos(id,blobs){const r=await row(id);const fotos=[...(r?.fotos||[]),...await upload(id,blobs)];await save(id,{status:'erlebt',erlebt_am:r?.erlebt_am,erinnerung:r?.erinnerung,fotos})},
  async letters(){const {data,error}=await sb.from(M).select('*').order('created_at');if(error)throw error;return data},
  async sendLetter(von,an,text){const {error}=await sb.from(M).insert({von,an,text});if(error)throw error},
  async markRead(ids){if(ids.length)await sb.from(M).update({gelesen:true}).in('id',ids)},
  async roomPhoto(){return signed('raum/lieblingsbild.jpg')},
  async setRoomPhoto(blob){const p='raum/lieblingsbild.jpg';let up=await sb.storage.from(B).upload(p,blob,{contentType:'image/jpeg',upsert:true});
   if(up.error){await sb.storage.from(B).remove([p]);up=await sb.storage.from(B).upload(p,blob,{contentType:'image/jpeg'})}if(up.error)throw up.error}};
}
let store=local;const ready=(async()=>{try{const s=await supabaseBackend();if(s)store=s}catch(e){console.warn('Supabase nicht erreichbar, nutze Handy-Speicher',e)}})();
export async function roomPhotoUrl(){await ready;try{return await store.roomPhoto()}catch{return null}}

// ---------------- data & filter ----------------
let LIST=null;
async function ideas(){if(!LIST){const r=await fetch(new URL('./dates.json',import.meta.url),{cache:'no-cache'});LIST=(await r.json()).dates}return LIST}
const KIDS=['Willi','Alina','Robert'];
// Who may be along for each category (Franzi and Ricardo are always there).
function fitsPeople(kat,sel){const n=sel.length;
 if(kat==='paar')return n===0;
 if(kat==='willi')return n===1&&sel[0]==='Willi';
 if(kat==='familie')return n>=2;
 return true} // flexibel
const TIME={kurz:['kurz'],mittel:['kurz','mittel'],egal:['kurz','mittel','lang']};
function matches(list,rec,f){return list.filter(x=>!rec[x.id]&&fitsPeople(x.kategorie,f.people)&&x.kosten<=f.budget&&(f.ort==='egal'||x.ort===f.ort)&&TIME[f.zeit].includes(x.dauer))}
export async function progress(){await ready;const [l,r]=await Promise.all([ideas(),store.records().catch(()=>({}))]);const done=l.filter(x=>r[x.id]?.status==='erlebt').length;return{done,total:l.length}}
async function announce(){if(store.kind==='supabase'&&!await store.loggedIn())return;const p=await progress();window.dispatchEvent(new CustomEvent('rr-dates-progress',{detail:p}))}

// ---------------- helpers ----------------
const el=html=>{const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=d=>d?new Date(d+(d.length===10?'T12:00':'')).toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'}):'';
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
function overlay(kind){const o=el('<div class="dr-ov"><div class="dr-card"><button class="dr-x" aria-label="Schließen">✕</button><div class="dr-body"></div></div></div>');o.dataset.kind=kind;document.body.appendChild(o);
 o.querySelector('.dr-x').onclick=()=>close(o);o.addEventListener('click',e=>{if(e.target===o)close(o)});return o}
function open(o){o.classList.add('on');window.__drOpen=true;window.dispatchEvent(new CustomEvent('rr-dates-ui',{detail:{kind:o.dataset.kind,open:true}}))}
function close(o){o.classList.remove('on');window.__drOpen=document.querySelectorAll('.dr-ov.on').length>0;window.dispatchEvent(new CustomEvent('rr-dates-ui',{detail:{kind:o.dataset.kind,open:false}}))}
let actx;function tone(f=900,d=.06,v=.08){try{actx??=new (window.AudioContext||window.webkitAudioContext)();actx.resume();const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(v,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+d);o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+d+.01)}catch{}}
const note=()=>store.kind==='local'?'<div class="dr-note">Wird noch nur auf diesem Handy gespeichert, bis Supabase fertig eingerichtet ist.</div>':'<div class="dr-note">🔒 Privat, nur für Franzi und Ricardo · <button class="dr-logout" style="border:0;background:none;color:#c2185b;font:inherit;text-decoration:underline;padding:0">Abmelden</button></div>';
document.addEventListener('click',async e=>{if(!e.target.closest('.dr-logout'))return;await store.logout();document.querySelectorAll('.dr-ov.on').forEach(close)});
async function needLogin(body,then){if(store.kind!=='supabase'||await store.loggedIn())return false;
 body.innerHTML=`<h2>Anmelden</h2><p class="sub">Damit nur ihr zwei das hier seht.</p><input type="email" placeholder="E-Mail" autocomplete="username"><input type="password" placeholder="Passwort" autocomplete="current-password"><button class="dr-btn" style="width:100%">Anmelden</button><div class="dr-note"></div>`;
 const go=async()=>{const [e,p]=body.querySelectorAll('input'),b=body.querySelector('button');b.disabled=true;try{await store.login(e.value.trim(),p.value);announce();then()}catch(err){b.disabled=false;body.querySelector('.dr-note').textContent=err.message}};
 body.querySelector('button').onclick=go;body.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')go()});return true}
async function whoAmI(body,then){const me=await store.me();if(me)return me;
 body.innerHTML=`<h2>Wer bist du?</h2><p class="sub">Das merkt sich dieses Handy.</p><div class="dr-pick"><button class="dr-btn">Franzi</button><button class="dr-btn turq">Ricardo</button></div>`;
 body.querySelectorAll('button').forEach(b=>b.onclick=async()=>{await store.setMe(b.textContent);then()});return null}
// Downscale a photo to max 1600 px as JPEG. Works on phones that lack createImageBitmap for some files.
async function shrink(file){if(!(file instanceof Blob))throw new Error('Kein Foto ausgewählt.');
 let img;try{img=await createImageBitmap(file)}catch{img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Dieses Foto kann der Browser nicht lesen. Bitte als JPG speichern und nochmal versuchen.'));i.src=URL.createObjectURL(file)})}
 const w=img.width||img.naturalWidth,h=img.height||img.naturalHeight,k=Math.min(1,1600/Math.max(w,h));const c=document.createElement('canvas');c.width=w*k|0;c.height=h*k|0;c.getContext('2d').drawImage(img,0,0,c.width,c.height);
 const out=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));if(!out)throw new Error('Foto konnte nicht umgewandelt werden.');return out}
const tagText=x=>[x.kosten===0?'kostenlos':`bis ${x.kosten} €`,x.ort==='zuhause'?'zu Hause':'unterwegs',{kurz:'bis 1 Std.',mittel:'1–3 Std.',lang:'länger'}[x.dauer]];

// ---------------- date box (generator) ----------------
const boxOv=overlay('box');
let filt=Object.assign({people:[],budget:20,ort:'egal',zeit:'egal'},ls.get('date_filter',{}));let current=null,lastId=null;
export async function openDateBox(){await ready;open(boxOv);current=null;renderBox()}
export const openWheel=openDateBox;
async function renderBox(){const body=boxOv.querySelector('.dr-body');if(await needLogin(body,renderBox))return;
 const [list,rec]=await Promise.all([ideas(),store.records().catch(()=>({}))]);
 const done=list.filter(x=>rec[x.id]?.status==='erlebt').length,planned=list.filter(x=>rec[x.id]?.status==='geplant');
 const chip=(group,val,label,on)=>`<button class="dr-chip ${on?'on':''}" data-g="${group}" data-v="${val}">${label}</button>`;
 const pool=matches(list,rec,filt);
 body.innerHTML=`<h2>Date-Box</h2>
 <div class="dr-prog"><b>${done} von ${list.length} Dates erlebt</b><div class="bar"><i style="width:${done/list.length*100}%"></i></div></div>
 <div class="dr-sec">WER IST DABEI?</div><div class="dr-chips"><span class="dr-chip fix">Franzi ✓</span><span class="dr-chip fix">Ricardo ✓</span>${KIDS.map(k=>chip('p',k,k,filt.people.includes(k))).join('')}${chip('ar','','Alina + Robert',filt.people.includes('Alina')&&filt.people.includes('Robert'))}</div>
 <div class="dr-sec">BUDGET (INSGESAMT)</div><div class="dr-chips">${[[0,'Kostenlos'],[10,'Bis 10 €'],[20,'Bis 20 €']].map(([v,l])=>chip('b',v,l,filt.budget===v)).join('')}</div>
 <div class="dr-sec">WO?</div><div class="dr-chips">${[['zuhause','Zu Hause'],['unterwegs','Unterwegs'],['egal','Egal']].map(([v,l])=>chip('o',v,l,filt.ort===v)).join('')}</div>
 <div class="dr-sec">WIE VIEL ZEIT?</div><div class="dr-chips">${[['kurz','Kurz (bis 1 Std.)'],['mittel','Bis 3 Std.'],['egal','Egal']].map(([v,l])=>chip('z',v,l,filt.zeit===v)).join('')}</div>
 <div class="dr-out">${current?ticket(current,pool.length):''}</div>
 ${current?'':`<button class="dr-btn dr-draw" ${pool.length?'':'disabled style="opacity:.5"'}>🎁 Date ziehen</button><div class="dr-note" style="margin-top:6px">${pool.length?`${pool.length} passende Idee${pool.length>1?'n':''} in der Box`:'Keine passende Idee. Lockere Budget, Ort oder Zeit.'}</div>`}
 ${planned.length?`<div class="dr-h3">STEHT AN</div><div class="dr-list">${planned.map(x=>`<div class="dr-item"><span>${esc(x.titel)}<small>${esc(x.text)}</small></span><button data-doc="${x.id}">Erlebt ✓</button></div>`).join('')}</div>`:''}
 ${note()}`;
 body.querySelectorAll('.dr-chip[data-g]').forEach(b=>b.onclick=()=>{const g=b.dataset.g,v=b.dataset.v;
  if(g==='p')filt.people=filt.people.includes(v)?filt.people.filter(x=>x!==v):[...filt.people,v];
  if(g==='ar'){const both=filt.people.includes('Alina')&&filt.people.includes('Robert');filt.people=both?filt.people.filter(x=>x!=='Alina'&&x!=='Robert'):[...new Set([...filt.people,'Alina','Robert'])]}
  if(g==='b')filt.budget=+v;if(g==='o')filt.ort=v;if(g==='z')filt.zeit=v;
  filt.people=KIDS.filter(k=>filt.people.includes(k));ls.set('date_filter',filt);current=null;renderBox()});
 const drawBtn=body.querySelector('.dr-draw');if(drawBtn)drawBtn.onclick=()=>draw(pool);
 const again=body.querySelector('.again');if(again)again.onclick=()=>draw(pool);
 const yes=body.querySelector('.yes');if(yes)yes.onclick=async()=>{yes.disabled=true;await store.plan(current.id);current=null;renderBox()};
 const now=body.querySelector('.now');if(now)now.onclick=()=>documentDate(current.id);
 body.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>documentDate(b.dataset.doc));
 announce()}
function ticket(x,n){return `<div class="dr-ticket"><b>${esc(x.titel)}</b>${esc(x.text)}<div class="dr-tags">${tagText(x).map(t=>`<span>${t}</span>`).join('')}</div>
 <div class="dr-row" style="margin-top:12px;justify-content:center"><button class="dr-btn yes">Das machen wir! 💗</button>${n>1?'<button class="dr-btn alt again">Neu ziehen</button>':''}</div>
 <button class="dr-btn alt now" style="margin-top:8px;width:100%">Schon erlebt? Jetzt eintragen</button></div>`}
function draw(pool){if(!pool.length)return;let options=pool.length>1?pool.filter(x=>x.id!==lastId):pool;const x=options[Math.floor(Math.random()*options.length)];
 const out=boxOv.querySelector('.dr-out');out.innerHTML='<div class="dr-empty">🎁 Die Box wird geschüttelt …</div>';
 let k=0;const iv=setInterval(()=>{tone(600+k*60,.05);navigator.vibrate?.(10);if(++k>8){clearInterval(iv);current=x;lastId=x.id;[523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.15,.1),i*110));renderBox()}},90)}

// ---------------- document a date ----------------
async function documentDate(id){const body=boxOv.querySelector('.dr-body');const x=(await ideas()).find(d=>d.id===id);let files=[];
 body.innerHTML=`<h2>Erlebt! 💗</h2><p class="sub">${esc(x.titel)}</p>
 <label class="f">WANN?</label><input type="date" value="${today()}" max="${today()}">
 <label class="f">FOTOS</label><label class="dr-btn turq" style="display:block;text-align:center">📷 Fotos auswählen<input type="file" accept="image/*" multiple hidden></label><div class="dr-thumbs"></div>
 <label class="f">UNSERE ERINNERUNG</label><textarea placeholder="Was war schön, lustig, besonders?"></textarea>
 <div class="dr-row" style="margin-top:12px"><button class="dr-btn save" style="flex:1">Ins Fotobuch eintragen</button><button class="dr-btn alt back">Zurück</button></div><div class="dr-note msg"></div>`;
 const inp=body.querySelector('input[type=file]'),th=body.querySelector('.dr-thumbs');
 inp.onchange=()=>{if(!inp.files||!inp.files.length)return;files=[...files,...inp.files];th.innerHTML=files.map(f=>`<img src="${URL.createObjectURL(f)}" alt="">`).join('')};
 body.querySelector('.back').onclick=()=>renderBox();
 body.querySelector('.save').onclick=async e=>{const btn=e.currentTarget,msg=body.querySelector('.msg');btn.disabled=true;
  try{msg.textContent=files.length?'Fotos werden vorbereitet …':'Wird gespeichert …';const blobs=[];for(const f of files)blobs.push(await shrink(f));
   await store.complete(id,{erlebt_am:body.querySelector('input[type=date]').value||today(),erinnerung:body.querySelector('textarea').value.trim(),blobs});
   current=null;close(boxOv);announce();openAlbum(id)}catch(err){btn.disabled=false;msg.textContent='Speichern hat nicht geklappt: '+err.message}}}

// ---------------- mailbox ----------------
const mailOv=overlay('mail');
export async function openMailbox(){await ready;open(mailOv);renderMail()}
async function renderMail(write=false){const body=mailOv.querySelector('.dr-body');if(await needLogin(body,()=>renderMail()))return;
 const me=await whoAmI(body,()=>renderMail());if(!me)return;const other=me==='Franzi'?'Ricardo':'Franzi';
 if(write){body.innerHTML=`<h2>Brief an ${other}</h2><p class="sub">Was möchtest du ${other} sagen?</p><textarea placeholder="Lieber ${other}, …"></textarea><div class="dr-row" style="margin-top:10px"><button class="dr-btn send" style="flex:1">Einwerfen 💌</button><button class="dr-btn alt back">Zurück</button></div>`;
  body.querySelector('.back').onclick=()=>renderMail();body.querySelector('.send').onclick=async()=>{const t=body.querySelector('textarea').value.trim();if(!t)return;await store.sendLetter(me,other,t);renderMail()};return}
 const letters=(await store.letters().catch(()=>[])).slice().reverse();const unread=letters.filter(l=>l.an===me&&!l.gelesen);
 body.innerHTML=`<h2>Briefkasten</h2><p class="sub">${unread.length?`${unread.length} neue${unread.length>1?'':'r'} Brief${unread.length>1?'e':''} für dich 💌`:'Hallo '+esc(me)+'!'}</p>
 <button class="dr-btn" style="width:100%">Brief an ${other} schreiben ✍️</button>
 <div class="dr-list">${letters.map(l=>`<div class="dr-letter ${l.von===me?'me':''} ${l.an===me&&!l.gelesen?'new':''}"><small>${l.von===me?'Du an '+esc(l.an):'Von '+esc(l.von)} · ${fmt(l.created_at)}</small><p>${esc(l.text)}</p></div>`).join('')||'<div class="dr-note">Noch keine Briefe. Schreib den ersten!</div>'}</div>${note()}`;
 body.querySelector('.dr-btn').onclick=()=>renderMail(true);store.markRead(unread.map(l=>l.id)).catch(()=>{})}

// ---------------- favourite photo in the heart frame ----------------
const heartOv=overlay('heart');
export async function openRoomPhoto(){await ready;open(heartOv);renderHeart()}
async function renderHeart(){const body=heartOv.querySelector('.dr-body');if(await needLogin(body,renderHeart))return;
 if(!store.setRoomPhoto){body.innerHTML='<h2>Lieblingsbild</h2><p class="sub">Das geht erst, wenn Supabase verbunden ist.</p>';return}
 const cur=await store.roomPhoto().catch(()=>null);let file=null;
 body.innerHTML=`<h2>Lieblingsbild</h2><p class="sub">Das Foto im Herz über dem Sofa. Am schönsten, wenn eure Gesichter in der Mitte sind.</p>
 <div class="dr-photos" style="grid-template-columns:1fr"><img class="pv" src="${cur||''}" alt="" style="${cur?'':'display:none'}"></div>${cur?'':'<div class="dr-empty">Noch kein Bild hochgeladen.</div>'}
 <label class="dr-btn turq" style="display:block;text-align:center;margin-top:10px">📷 Foto auswählen<input type="file" accept="image/*" hidden></label>
 <button class="dr-btn save" style="width:100%;margin-top:8px" disabled>Ins Herz hängen 💗</button><div class="dr-note msg"></div>${note()}`;
 const inp=body.querySelector('input'),pv=body.querySelector('.pv'),save=body.querySelector('.save'),msg=body.querySelector('.msg');
 inp.onchange=()=>{const f=inp.files&&inp.files[0];if(!f)return;file=f;pv.src=URL.createObjectURL(file);pv.style.display='';body.querySelector('.dr-empty')?.remove();save.disabled=false};
 save.onclick=async()=>{save.disabled=true;msg.textContent='Wird hochgeladen …';try{await store.setRoomPhoto(await shrink(file));msg.textContent='Hängt im Herz! 💗';window.dispatchEvent(new CustomEvent('rr-dates-auth',{detail:{loggedIn:true}}));setTimeout(()=>close(heartOv),900)}catch(e){save.disabled=false;msg.textContent='Hochladen hat nicht geklappt: '+e.message}}}

// ---------------- photo album ----------------
const albumOv=overlay('album');let page=0;
export async function openAlbum(focusId){await ready;open(albumOv);renderAlbum(focusId)}
async function renderAlbum(focusId){const body=albumOv.querySelector('.dr-body');if(await needLogin(body,()=>renderAlbum(focusId)))return;
 const [list,rec]=await Promise.all([ideas(),store.records().catch(()=>({}))]);
 const done=list.filter(x=>rec[x.id]?.status==='erlebt').sort((a,b)=>(rec[a.id].erlebt_am||'').localeCompare(rec[b.id].erlebt_am||''));
 if(focusId){const i=done.findIndex(x=>x.id===focusId);if(i>=0)page=i+1}page=Math.max(0,Math.min(page,done.length));
 let inner;
 if(page===0)inner=`<div class="dr-cover"><div><b>Unsere Dates</b><br><br>${done.length?`${done.length} von ${list.length} erlebt`:'Noch leer. Zieht ein Date aus der Box!'}<br><br>💗</div></div>`;
 else{const x=done[page-1],r=rec[x.id];
  inner=`<div class="dr-book"><div class="dr-h3" style="margin-top:0">${esc(fmt(r.erlebt_am).toUpperCase())}</div><h2 style="font-size:22px">${esc(x.titel)}</h2>
  ${r.erinnerung?`<div class="dr-mem">„${esc(r.erinnerung)}“</div>`:''}<div class="dr-photos">${(r.fotos||[]).filter(Boolean).map(u=>`<img src="${u}" alt="">`).join('')}</div>
  <label class="dr-btn alt" style="display:block;text-align:center">📷 Weitere Fotos einkleben<input type="file" accept="image/*" multiple hidden></label><div class="dr-note up"></div></div>`}
 body.innerHTML=`<h2>Fotobuch</h2>${inner}<div class="dr-pager"><button class="dr-btn alt prev" ${page===0?'disabled style="opacity:.4"':''}>‹</button><span>${page===0?'Titel':`Seite ${page} von ${done.length}`}</span><button class="dr-btn alt next" ${page>=done.length?'disabled style="opacity:.4"':''}>›</button></div>${note()}`;
 body.querySelector('.prev').onclick=()=>{page--;renderAlbum()};body.querySelector('.next').onclick=()=>{page++;renderAlbum()};
 const inp=body.querySelector('input[type=file]');if(inp)inp.onchange=async()=>{const n=body.querySelector('.up');try{n.textContent='Fotos werden eingeklebt …';const blobs=[];for(const f of inp.files)blobs.push(await shrink(f));await store.addPhotos(done[page-1].id,blobs);renderAlbum()}catch(e){n.textContent='Hat nicht geklappt: '+e.message}}}
ready.then(announce);window.addEventListener('rr-dates-auth',()=>announce());
