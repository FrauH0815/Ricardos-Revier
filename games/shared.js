// Shared helpers for the Ricardos-Revier mini games: progress, trophies, synthesized sound.
export const $=s=>document.querySelector(s);

const store={
 get(k,d){try{const v=localStorage.getItem('rr_'+k);return v===null?d:JSON.parse(v)}catch{return d}},
 set(k,v){try{localStorage.setItem('rr_'+k,JSON.stringify(v))}catch{}}
};
export const progress={
 get:store.get,set:store.set,
 unlocked(game){return store.get(game+'_unlocked',0)},
 unlock(game,idx){if(idx>store.get(game+'_unlocked',0))store.set(game+'_unlocked',idx)}
};

// Trophies are kept in localStorage and announced to the workshop (when the game runs inside the TV).
export function trophy(game,id,title){
 const all=store.get('trophies',[]);const key=game+':'+id;
 if(all.some(t=>t.key===key))return false;
 all.push({key,game,title,date:new Date().toISOString()});store.set('trophies',all);
 try{window.parent!==window&&window.parent.postMessage({type:'rr-trophy',game,id,title},'*')}catch{}
 const el=document.createElement('div');el.className='trophy-toast';el.innerHTML='🏆 <b>Neue Trophäe</b><br>'+title;document.body.appendChild(el);
 setTimeout(()=>el.classList.add('show'),30);setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),600)},3600);
 return true;
}

// Small synthesized sound effects, no audio files needed.
export class Sfx{
 constructor(){this.ctx=null}
 unlock(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch{}}if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume()}
 noise(dur,freq,q=1,gain=.4,type='lowpass'){const c=this.ctx;if(!c)return;const b=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
  const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=c.createGain();g.gain.value=gain;s.connect(f).connect(g).connect(c.destination);s.start()}
 tone(freq,dur,type='sine',gain=.2,slide=0){const c=this.ctx;if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),c.currentTime+dur);
  g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+dur)}
 splash(){this.noise(.6,900,.7,.5)}
 whoosh(){this.noise(.35,1800,2,.25,'bandpass')}
 bite(){this.tone(660,.12,'triangle',.18);setTimeout(()=>this.tone(880,.15,'triangle',.18),110)}
 reel(){for(let i=0;i<4;i++)setTimeout(()=>this.noise(.02,4000,4,.25,'highpass'),i*28)}
 creak(){this.tone(140,.35,'sawtooth',.06,-40)}
 snap(){this.noise(.15,3000,1,.4,'highpass');this.tone(300,.3,'square',.05,-200)}
 win(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.tone(f,.25,'triangle',.15),i*110))}
 roll(){this.noise(1.6,220,.8,.35)}
 pins(n){for(let i=0;i<Math.min(10,n*2+2);i++)setTimeout(()=>{this.noise(.12,1800+Math.random()*1500,3,.3,'bandpass');this.tone(500+Math.random()*700,.08,'triangle',.06)},i*35+Math.random()*30)}
 shot(){this.noise(.5,2500,.6,.9);this.noise(1.6,180,.7,.6)}
 click(){this.noise(.03,5000,3,.2,'highpass')}
}

// Inside the workshop TV the back arrow closes the game instead of loading the garage in the frame.
if(window.parent!==window){addEventListener('DOMContentLoaded',()=>{});queueMicrotask(()=>{const b=document.querySelector('.back');if(b)b.addEventListener('click',e=>{e.preventDefault();window.parent.postMessage({type:'rr-close'},'*')})})}
