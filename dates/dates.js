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
`;
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));

// ---------------- storage backends ----------------
const idb=(()=>{let db;const open=()=>db||(db=new Promise((res,rej)=>{const r=indexedDB.open('rr-dates',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
 const tx=async(mode,fn)=>{const d=await open();return new Promise((res,rej)=>{const t=d.transaction('photos',mode);const out=fn(t.objectStore('photos'));t.oncomplete=()=>res(out&&out.result!==undefined?out.result:out);t.onerror=()=>rej(t.error)})};
 return{put:p=>tx('readwrite',s=>s.put(p)),all:()=>tx('readonly',s=>s.getAll())}})();
const ls={get(k,d){try{return JSON.parse(localStorage.getItem('rr_'+k))??d}catch{return d}},set(k,v){try{localStorage.setItem('rr_'+k,JSON.stringify(v))}catch{}}};

const local={kind:'local',
 async me(){return ls.get('me',null)},async setMe(n){ls.set('me',n)},
 async statuses(){return ls.get('date_status',{})},
 async setStatus(id,status){const s=ls.get('date_status',{});if(status)s[id]={status,datum:new Date().toISOString().slice(0,10)};else delete s[id];ls.set('date_status',s)},
 async letters(){return ls.get('letters',[])},
 async sendLetter(von,an,text){const l=ls.get('letters',[]);l.push({id:Date.now()+'',von,an,text,gelesen:false,created_at:new Date().toISOString()});ls.set('letters',l)},
 async markRead(ids){const l=ls.get('letters',[]);l.forEach(x=>{if(ids.includes(x.id))x.gelesen=true});ls.set('letters',l)},
 async photos(){const all=await idb.all().catch(()=>[]);return all.map(p=>({date_id:p.date_id,url:URL.createObjectURL(p.blob),created_at:p.created_at}))},
 async addPhoto(dateId,blob){await idb.put({id:dateId+':'+Date.now()+Math.random(),date_id:dateId,blob,created_at:new Date().toISOString()})},
 async roomPhoto(){return null}};

async function supabaseBackend(){
 let cfg;try{cfg=await import('./config.js')}catch{return null}
 // Only switch over once login and the table layout are confirmed (cfg.DATES_READY), until then stay on this phone.
 if(!cfg.SUPABASE_URL||!(cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY)||!cfg.DATES_READY)return null;
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
 const sb=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY);const BUCKET=cfg.DATE_PHOTOS_BUCKET||'date-fotos';
 const name=async()=>{const {data}=await sb.auth.getUser();return data.user?.user_metadata?.name||null};
 const signed=async(path)=>{const {data}=await sb.storage.from(BUCKET).createSignedUrl(path,3600);return data?.signedUrl||null};
 return{kind:'supabase',sb,
  async loggedIn(){const {data}=await sb.auth.getSession();return !!data.session},
  async login(email,pw){const {error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error},
  me:name,async setMe(){},
  async statuses(){const {data,error}=await sb.from('date_status').select('*');if(error)throw error;return Object.fromEntries(data.map(r=>[r.date_id,{status:r.status,datum:r.datum}]))},
  async setStatus(id,status){if(!status){await sb.from('date_status').delete().eq('date_id',id);return}
   const {error}=await sb.from('date_status').upsert({date_id:id,status,datum:new Date().toISOString().slice(0,10),updated_at:new Date().toISOString(),updated_by:await name()});if(error)throw error},
  async letters(){const {data,error}=await sb.from('letters').select('*').order('created_at');if(error)throw error;return data},
  async sendLetter(von,an,text){const {error}=await sb.from('letters').insert({von,an,text});if(error)throw error},
  async markRead(ids){if(ids.length)await sb.from('letters').update({gelesen:true}).in('id',ids)},
  async photos(){const {data,error}=await sb.from('photos').select('*').order('created_at');if(error)throw error;
   return Promise.all(data.map(async p=>({date_id:p.date_id,url:await signed(p.path),created_at:p.created_at})))},
  async addPhoto(dateId,blob){const path=`${dateId}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.jpg`;
   const up=await sb.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg'});if(up.error)throw up.error;
   const {error}=await sb.from('photos').insert({date_id:dateId,path});if(error)throw error},
  async roomPhoto(){return signed('raum/lieblingsbild.jpg')}};
}
let store=local;const ready=(async()=>{try{const s=await supabaseBackend();if(s)store=s}catch(e){console.warn('Supabase nicht erreichbar, nutze Handy-Speicher',e)}})();
export async function roomPhotoUrl(){await ready;try{return await store.roomPhoto()}catch{return null}}

// ---------------- data ----------------
let DATES=null;
async function dates(){if(!DATES){const r=await fetch(new URL('./dates.json',import.meta.url));DATES=await r.json()}return DATES}
const allDates=async()=>{const d=await dates();return [...d.zwei,...d.kinder]};
const byId=async id=>(await allDates()).find(x=>x.id===id);

// ---------------- helpers ----------------
const el=(html)=>{const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=d=>d?new Date(d).toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'}):'';
function overlay(){const o=el('<div class="dr-ov"><div class="dr-card"><button class="dr-x" aria-label="Schließen">✕</button><div class="dr-body"></div></div></div>');document.body.appendChild(o);
 o.querySelector('.dr-x').onclick=()=>close(o);o.addEventListener('click',e=>{if(e.target===o)close(o)});return o}
function open(o){o.classList.add('on');window.__drOpen=true}
function close(o){o.classList.remove('on');window.__drOpen=document.querySelectorAll('.dr-ov.on').length>0}
let actx;function tick(f=900){try{actx??=new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.08,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+.05);o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+.06)}catch{}}
function storageNote(){return store.kind==='local'?'<div class="dr-note">Wird noch nur auf diesem Handy gespeichert. Sobald Supabase verbunden ist, seht ihr beide dasselbe.</div>':''}
async function needLogin(body,then){if(store.kind!=='supabase'||await store.loggedIn())return false;
 body.innerHTML=`<h2>Anmelden</h2><p class="sub">Damit nur ihr zwei das hier seht.</p><input type="email" placeholder="E-Mail" autocomplete="username"><input type="password" placeholder="Passwort" autocomplete="current-password"><button class="dr-btn" style="width:100%">Anmelden</button><div class="dr-note"></div>`;
 body.querySelector('button').onclick=async()=>{const [e,p]=body.querySelectorAll('input');try{await store.login(e.value.trim(),p.value);then()}catch(err){body.querySelector('.dr-note').textContent='Das hat nicht geklappt: '+err.message}};return true}
async function whoAmI(body,then){const me=await store.me();if(me)return me;
 body.innerHTML=`<h2>Wer bist du?</h2><p class="sub">Das merkt sich dieses Handy.</p><div class="dr-pick"><button class="dr-btn">Franzi</button><button class="dr-btn turq">Ricardo</button></div>`;
 body.querySelectorAll('button').forEach(b=>b.onclick=async()=>{await store.setMe(b.textContent);then()});return null}

// ---------------- wheel ----------------
const wheelOv=overlay();const COLORS=['#ff5fa2','#ffffff','#ffb3d1','#7fe0dc','#e0337f','#ffd6e7'];
let cat='zwei',rot=0,spinning=false;
export async function openWheel(){await ready;open(wheelOv);renderWheel()}
async function renderWheel(){const body=wheelOv.querySelector('.dr-body');if(await needLogin(body,renderWheel))return;
 const d=await dates(),st=await store.statuses().catch(()=>({}));const list=d[cat],left=list.filter(x=>!st[x.id]);
 const planned=[...d.zwei,...d.kinder].filter(x=>st[x.id]?.status==='geplant');const done=[...d.zwei,...d.kinder].filter(x=>st[x.id]?.status==='erledigt').length;
 body.innerHTML=`<h2>Date-Glücksrad</h2><p class="sub">${done} Dates schon erlebt · ${left.length} noch im Rad</p>
 <div class="dr-tabs"><button data-c="zwei" class="${cat==='zwei'?'on':''}">💗 Wir zwei (${d.zwei.length})</button><button data-c="kinder" class="${cat==='kinder'?'on':''}">🧸 Mit den Kindern (${d.kinder.length})</button></div>
 <div class="dr-wheel"><div class="dr-ptr"></div><canvas width="600" height="600"></canvas></div>
 <div class="dr-out"></div><button class="dr-btn spin" style="width:100%">${left.length?'Drehen!':'Alle erlebt! 🎉'}</button>
 ${planned.length?`<div class="dr-h3">GEPLANT</div><div class="dr-list">${planned.map(x=>`<div class="dr-item"><span>${esc(x.titel)}<small>${esc(x.text)}</small></span><button data-done="${x.id}">Erledigt ✓</button></div>`).join('')}</div>`:''}
 ${storageNote()}`;
 body.querySelectorAll('.dr-tabs button').forEach(b=>b.onclick=()=>{if(spinning)return;cat=b.dataset.c;rot=0;renderWheel()});
 body.querySelectorAll('[data-done]').forEach(b=>b.onclick=async()=>{await store.setStatus(b.dataset.done,'erledigt');close(wheelOv);openAlbum(b.dataset.done)});
 const cv=body.querySelector('canvas');drawWheel(cv,left.length||1);cv.style.transform=`rotate(${rot}rad)`;
 const btn=body.querySelector('.spin');btn.disabled=!left.length;btn.onclick=()=>spin(cv,left,body.querySelector('.dr-out'),btn)}
function drawWheel(cv,n){const g=cv.getContext('2d'),R=300;g.clearRect(0,0,600,600);const a=Math.PI*2/n;
 for(let i=0;i<n;i++){g.beginPath();g.moveTo(R,R);g.arc(R,R,R-2,-Math.PI/2+i*a,-Math.PI/2+(i+1)*a);g.closePath();g.fillStyle=COLORS[i%COLORS.length];if(n%COLORS.length===1&&i===n-1)g.fillStyle=COLORS[2];g.fill();g.strokeStyle='#ffffffaa';g.lineWidth=1;g.stroke()}
 g.font='24px system-ui';g.textAlign='center';g.textBaseline='middle';
 for(let i=0;i<n;i+=Math.max(1,Math.round(n/12))){const m=-Math.PI/2+(i+.5)*a;g.fillText('♥',R+Math.cos(m)*(R-34),R+Math.sin(m)*(R-34))}
 g.beginPath();g.arc(R,R,58,0,7);g.fillStyle='#fff';g.fill();g.lineWidth=8;g.strokeStyle='#ff5fa2';g.stroke();g.fillStyle='#e0337f';g.font='900 52px system-ui';g.fillText('♥',R,R+4)}
function spin(cv,left,out,btn){if(spinning||!left.length)return;spinning=true;btn.disabled=true;out.innerHTML='';try{actx??=new (window.AudioContext||window.webkitAudioContext)();actx.resume()}catch{}
 const n=left.length,a=Math.PI*2/n,pick=Math.floor(Math.random()*n);
 // the pointer is at the top: segment `pick` must end up under it
 const base=-(pick+.5)*a+(Math.random()-.5)*a*.7;const start=rot,target=base-Math.ceil((start-base)/(Math.PI*2))*Math.PI*2-Math.PI*2*(5+Math.floor(Math.random()*3));
 const t0=performance.now(),dur=5200;let lastSeg=null;
 function step(now){const t=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-t,4);rot=start+(target-start)*e;cv.style.transform=`rotate(${rot}rad)`;
  const seg=Math.floor(((-rot%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/a);if(seg!==lastSeg){lastSeg=seg;tick(700+Math.random()*300);if(t>.85)navigator.vibrate?.(8)}
  if(t<1)requestAnimationFrame(step);else done()}
 requestAnimationFrame(step);
 function done(){spinning=false;const x=left[pick];navigator.vibrate?.([40,30,80]);[523,659,784].forEach((f,i)=>setTimeout(()=>tick(f),i*120));
  out.innerHTML=`<div class="dr-res"><b>${esc(x.titel)}</b>${esc(x.text)}<div class="dr-row" style="margin-top:12px;justify-content:center"><button class="dr-btn yes">Das machen wir! 💗</button><button class="dr-btn alt again">Nochmal</button></div></div>`;
  btn.style.display='none';out.querySelector('.again').onclick=()=>{btn.style.display='';btn.disabled=false;out.innerHTML=''};
  out.querySelector('.yes').onclick=async()=>{await store.setStatus(x.id,'geplant');renderWheel()}}}

// ---------------- mailbox ----------------
const mailOv=overlay();
export async function openMailbox(){await ready;open(mailOv);renderMail()}
async function renderMail(write=false){const body=mailOv.querySelector('.dr-body');if(await needLogin(body,()=>renderMail()))return;
 const me=await whoAmI(body,()=>renderMail());if(!me)return;const other=me==='Franzi'?'Ricardo':'Franzi';
 if(write){body.innerHTML=`<h2>Brief an ${other}</h2><p class="sub">Was möchtest du ${other} sagen?</p><textarea placeholder="Lieber ${other}, …"></textarea><div class="dr-row" style="margin-top:10px"><button class="dr-btn send" style="flex:1">Einwerfen 💌</button><button class="dr-btn alt back">Zurück</button></div>`;
  body.querySelector('.back').onclick=()=>renderMail();body.querySelector('.send').onclick=async()=>{const t=body.querySelector('textarea').value.trim();if(!t)return;await store.sendLetter(me,other,t);renderMail()};return}
 const letters=(await store.letters().catch(()=>[])).slice().reverse();const unread=letters.filter(l=>l.an===me&&!l.gelesen);
 body.innerHTML=`<h2>Briefkasten</h2><p class="sub">${unread.length?`${unread.length} neue${unread.length>1?'':'r'} Brief${unread.length>1?'e':''} für dich 💌`:'Hallo '+esc(me)+'!'}</p>
 <button class="dr-btn" style="width:100%">Brief an ${other} schreiben ✍️</button>
 <div class="dr-list">${letters.map(l=>`<div class="dr-letter ${l.von===me?'me':''} ${l.an===me&&!l.gelesen?'new':''}"><small>${l.von===me?'Du an '+esc(l.an):'Von '+esc(l.von)} · ${fmt(l.created_at)}</small><p>${esc(l.text)}</p></div>`).join('')||'<div class="dr-note">Noch keine Briefe. Schreib den ersten!</div>'}</div>
 ${storageNote()}`;
 body.querySelector('.dr-btn').onclick=()=>renderMail(true);store.markRead(unread.map(l=>l.id)).catch(()=>{});window.dispatchEvent(new Event('rr-mail'))}
export async function unreadCount(){await ready;try{if(store.kind==='supabase'&&!await store.loggedIn())return 0;const me=await store.me();if(!me)return 0;return (await store.letters()).filter(l=>l.an===me&&!l.gelesen).length}catch{return 0}}

// ---------------- album ----------------
const albumOv=overlay();let page=0;
export async function openAlbum(focusId){await ready;open(albumOv);renderAlbum(focusId)}
async function shrink(file){const img=await createImageBitmap(file);const k=Math.min(1,1600/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=img.width*k|0;c.height=img.height*k|0;c.getContext('2d').drawImage(img,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,'image/jpeg',.85))}
async function renderAlbum(focusId){const body=albumOv.querySelector('.dr-body');if(await needLogin(body,()=>renderAlbum(focusId)))return;
 const st=await store.statuses().catch(()=>({})),all=await allDates();
 const done=all.filter(x=>st[x.id]?.status==='erledigt').sort((a,b)=>(st[a.id].datum||'').localeCompare(st[b.id].datum||''));
 const photos=await store.photos().catch(()=>[]);
 if(focusId){const i=done.findIndex(x=>x.id===focusId);if(i>=0)page=i+1}
 page=Math.max(0,Math.min(page,done.length));
 let inner;
 if(page===0)inner=`<div class="dr-cover"><div><b>Unsere Dates</b><br><br>${done.length?`${done.length} gemeinsame Erlebnisse`:'Noch leer. Dreht am Glücksrad!'}<br><br>💗</div></div>`;
 else{const x=done[page-1],ph=photos.filter(p=>p.date_id===x.id);
  inner=`<div class="dr-book"><div class="dr-h3" style="margin-top:0">${fmt(st[x.id].datum).toUpperCase()}</div><h2 style="font-size:22px">${esc(x.titel)}</h2><p class="sub">${esc(x.text)}</p>
  <div class="dr-photos">${ph.map(p=>`<img src="${p.url}" alt="">`).join('')}</div>
  <label class="dr-btn turq" style="display:block;text-align:center">📷 Fotos einkleben<input type="file" accept="image/*" multiple hidden></label><div class="dr-note up"></div></div>`}
 body.innerHTML=`<h2>Fotobuch</h2>${inner}<div class="dr-pager"><button class="dr-btn alt prev" ${page===0?'disabled style="opacity:.4"':''}>‹</button><span>${page===0?'Titel':`Seite ${page} von ${done.length}`}</span><button class="dr-btn alt next" ${page>=done.length?'disabled style="opacity:.4"':''}>›</button></div>${storageNote()}`;
 body.querySelector('.prev').onclick=()=>{page--;renderAlbum()};body.querySelector('.next').onclick=()=>{page++;renderAlbum()};
 const inp=body.querySelector('input[type=file]');if(inp)inp.onchange=async()=>{const note=body.querySelector('.up');const files=[...inp.files];let k=0;
  for(const f of files){note.textContent=`Klebe Foto ${++k} von ${files.length} ein …`;try{await store.addPhoto(done[page-1].id,await shrink(f))}catch(e){note.textContent='Foto konnte nicht gespeichert werden: '+e.message;return}}
  renderAlbum()}}
