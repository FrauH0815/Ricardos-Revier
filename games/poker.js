import {newSession,startHand,act,legal,botAction,rank,suit,evaluate,HANDS} from './poker-engine.mjs';
import {Sfx,trophy} from './shared.js';
const $=s=>document.querySelector(s),KEY='rr_poker_session_v1',BEST='rr_poker_best_v1',sfx=new Sfx();
if(window.parent!==window)document.body.classList.add('embedded');
let g=null,timer=null,opponents=2,rounds=5,menuOpen=true,best=1000,storageOK=true;
try{best=Math.max(1000,Number(localStorage.getItem(BEST))||1000);const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.version===1&&[2,3,4].includes(saved.opponents)&&Array.isArray(saved.players)&&saved.players.length===saved.opponents+1&&saved.players.every(p=>Number.isInteger(p.stack)&&p.stack>=0))g=saved}catch{}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(g));localStorage.setItem(BEST,String(best));storageOK=true}catch{storageOK=false}}
function random(){if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}return Math.random()}
function cardsHTML(cards,hidden=false){return cards.map(c=>hidden?'<span class="card back" aria-label="Verdeckte Karte"></span>':`<span class="card ${[1,2].includes(suit(c))?'red':''}" aria-label="${['','',2,3,4,5,6,7,8,9,10,'Bube','Dame','König','Ass'][rank(c)]} ${['Pik','Herz','Karo','Kreuz'][suit(c)]}"><small>${['','',2,3,4,5,6,7,8,9,10,'B','D','K','A'][rank(c)]}</small>${['♠','♥','♦','♣'][suit(c)]}</span>`).join('')}
function seat(p,i){const dealer=g.dealer===i?'<span class="dealer" title="Dealer">D</span>':'';return `<div class="seat ${g.actor===i?'turn':''} ${p.folded?'folded':''}"><div class="seatName">${p.name} ${dealer}</div><div class="stack">${p.stack.toLocaleString('de-DE')} ◉</div>${i?`<div class="cards">${cardsHTML(p.cards,g.phase!=='done'||p.folded)}</div>`:''}<div class="action">${p.action||'Am Tisch'}</div></div>`}
function draw(){
 if(!g)return;$('#game').hidden=false;$('#opponents').dataset.count=g.opponents;$('#opponents').innerHTML=g.players.slice(1).map((p,i)=>seat(p,i+1)).join('');
 $('#hero').innerHTML=seat(g.players[0],0)+`<div class="cards">${cardsHTML(g.players[0].cards)}</div>`;
 $('#board').innerHTML=cardsHTML(g.board)+Array.from({length:5-g.board.length},()=>'<span class="card empty"></span>').join('');
 $('#pot').textContent=`Pot ${g.players.reduce((s,p)=>s+(p.total||0),0).toLocaleString('de-DE')}`;
 $('#street').textContent={preflop:'Pre-Flop · Deine Startkarten',flop:'Flop',turn:'Turn',river:'River',done:'Hand beendet',idle:'Bereit'}[g.phase];
 $('#handCount').textContent=`Hand ${g.hand}${g.stopAtHand?' / '+g.stopAtHand:''}`;$('#record').textContent=`Rekord ${best.toLocaleString('de-DE')} ◉`;
 $('#log').innerHTML=g.log.map(t=>`<li>${t}</li>`).join('');const controls=$('#controls');controls.innerHTML='';
 if(g.phase==='done'){
  const hero=g.players[0],alive=g.players.filter(p=>p.stack>0).length;$('#status').innerHTML=g.result.map(r=>`<b>${g.players[r.i].name}</b>: ${r.amount} Chips · ${r.label}`).join('<br>');
  const end=hero.stack===0||alive===1,breakTime=g.stopAtHand&&g.hand>=g.stopAtHand;
  controls.innerHTML=`<button id="next" class="gold">${end?'Neuen Tisch wählen':breakTime?'Weitere '+g.batch+' Hände spielen':'Nächste Hand geben →'}</button>${end?`<div class="fine" style="text-align:center">${hero.stack===0?'Deine Chips sind aufgebraucht.':'Der Tisch gehört dir. Alle Gegner sind ausgeschieden.'}</div>`:''}`;
  $('#next').onclick=()=>{sfx.unlock();if(end)return showMenu();if(breakTime)g.stopAtHand=g.hand+g.batch;deal()};
 }else if(g.actor===0){
  const l=legal(g),own=g.players[0];$('#status').textContent=l.toCall?`Du bist dran · ${l.call} Chips zum Mitgehen`:'Du bist dran · Du kannst checken';
  controls.innerHTML=`<div class="actions"><button id="fold" class="fold">Passen</button><button id="call" class="gold">${l.check?'Check':l.call===own.stack?'All-in mitgehen · '+l.call:'Mitgehen · '+l.call}</button></div>`;
  $('#fold').onclick=()=>move('fold');$('#call').onclick=()=>move('call');
  if(l.canRaise){const min=Math.min(l.min,l.max),initial=Math.min(l.max,Math.max(min,g.currentBet+40));controls.insertAdjacentHTML('beforeend',`<div class="raiseRow"><label for="raiseAmount">${g.currentBet?'Erhöhen auf':'Setzen'}</label><input id="raiseAmount" type="range" min="${min}" max="${l.max}" step="1" value="${initial}"><output for="raiseAmount" id="raiseValue">${initial}</output><button id="raise">${initial===l.max?'All-in':'Chips setzen'}</button></div><div class="presets"><button data-size="min">Minimum</button><button data-size="pot">Pot</button><button data-size="all">All-in</button></div>`);
   const range=$('#raiseAmount');const update=()=>{$('#raiseValue').textContent=range.value;$('#raise').textContent=+range.value===l.max?'All-in':'Chips setzen'};range.oninput=update;
   controls.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const pot=g.players.reduce((s,p)=>s+p.total,0);range.value=b.dataset.size==='min'?min:b.dataset.size==='all'?l.max:Math.min(l.max,Math.max(min,g.currentBet+pot+l.call));update()});$('#raise').onclick=()=>move('raise',+range.value);
  }
 }else $('#status').textContent=`${g.players[g.actor]?.name||'Der Dealer'} überlegt …`;
 if(!storageOK)controls.insertAdjacentHTML('beforeend','<div class="saveWarning">Dieser Browser erlaubt gerade kein Speichern. Die Partie bleibt nur bis zum Schließen geöffnet.</div>');
}
function finished(){if(g.phase!=='done')return;best=Math.max(best,g.players[0].stack);if(g.result.some(r=>r.i===0)){trophy('poker','erste-hand','Poker: erste Hand gewonnen');if(g.board.length===5&&evaluate([...g.players[0].cards,...g.board])[0]>=6)trophy('poker','full-house','Poker: Full House oder besser')}if(g.players[0].stack>=2000)trophy('poker','doppelt','Poker: Chips verdoppelt')}
function schedule(){clearTimeout(timer);if(menuOpen||!g||g.phase==='done'||g.actor===0)return;timer=setTimeout(()=>{const decision=botAction(g,random);move(decision.type,decision.target)},650+Math.random()*500)}
function move(type,target){if(menuOpen)return;sfx.unlock();try{act(g,type,target);sfx.click();finished();persist();draw();schedule()}catch(e){$('#status').textContent='Aktion nicht möglich: '+e.message}}
function deal(){clearTimeout(timer);if(startHand(g,random)){persist();draw();schedule();sfx.whoosh()}}
function showMenu(){clearTimeout(timer);menuOpen=true;$('#menu').hidden=false;$('#resume').hidden=!g;$('#resetNote').hidden=!g;$('#menuButton').hidden=true}
function hideMenu(){menuOpen=false;$('#menu').hidden=true;$('#menuButton').hidden=false;if(g.phase!=='idle'){draw();schedule()}}
$('#menuButton').onclick=showMenu;
$('#opponentChoices').onclick=e=>{const b=e.target.closest('button[data-n]');if(!b)return;opponents=+b.dataset.n;$('#opponentChoices').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))};
$('#roundChoices').onclick=e=>{const b=e.target.closest('button[data-n]');if(!b)return;rounds=+b.dataset.n;$('#roundChoices').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))};
$('#resume').onclick=()=>{sfx.unlock();hideMenu()};
$('#start').onclick=()=>{sfx.unlock();g=newSession(opponents);g.batch=rounds;g.stopAtHand=rounds;hideMenu();deal()};
window.addEventListener('pagehide',()=>{if(g)persist()});
showMenu();
