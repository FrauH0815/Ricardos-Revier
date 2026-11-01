// Browser-local no-limit Texas Hold'em. No network or real-money features.
export const HANDS=['High Card','Ein Paar','Zwei Paare','Drilling','Straße','Flush','Full House','Vierling','Straight Flush'];
export const rank=c=>c%13+2;
export const suit=c=>Math.floor(c/13);
export function compare(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return Math.sign(d)}return 0}
export function evaluate(cards){
 if(cards.length<5)throw new Error('Five cards required');
 const counts=new Map();for(const c of cards)counts.set(rank(c),(counts.get(rank(c))||0)+1);
 const groups=[...counts].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
 const straight=rs=>{const a=[...new Set(rs)].sort((a,b)=>b-a);if(a.includes(14))a.push(1);for(let i=0;i<=a.length-5;i++)if(a[i]-a[i+4]===4)return a[i];return 0};
 const flush=[0,1,2,3].map(s=>cards.filter(c=>suit(c)===s).map(rank).sort((a,b)=>b-a)).find(a=>a.length>=5);
 if(flush&&straight(flush))return [8,straight(flush)];
 const four=groups.find(g=>g[1]===4);if(four)return [7,four[0],...groups.filter(g=>g!==four).map(g=>g[0]).sort((a,b)=>b-a).slice(0,1)];
 const triples=groups.filter(g=>g[1]>=3),pairs=groups.filter(g=>g[1]>=2);
 if(triples.length&&pairs.some(g=>g[0]!==triples[0][0]))return [6,triples[0][0],pairs.find(g=>g[0]!==triples[0][0])[0]];
 if(flush)return [5,...flush.slice(0,5)];
 const st=straight(cards.map(rank));if(st)return [4,st];
 if(triples.length)return [3,triples[0][0],...groups.filter(g=>g[0]!==triples[0][0]).map(g=>g[0]).sort((a,b)=>b-a).slice(0,2)];
 if(pairs.length>=2){const ps=pairs.map(g=>g[0]).sort((a,b)=>b-a).slice(0,2);return [2,...ps,...groups.filter(g=>!ps.includes(g[0])).map(g=>g[0]).sort((a,b)=>b-a).slice(0,1)]}
 if(pairs.length)return [1,pairs[0][0],...groups.filter(g=>g[0]!==pairs[0][0]).map(g=>g[0]).sort((a,b)=>b-a).slice(0,3)];
 return [0,...groups.map(g=>g[0]).sort((a,b)=>b-a).slice(0,5)];
}
export function shuffle(rng=Math.random){const d=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=Math.floor(rng()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
export function newSession(opponents=2){if(![2,3,4].includes(opponents))throw new Error('Choose 2, 3 or 4 opponents');return {version:1,opponents,players:['Ricardo','Ben','Mats','Uwe','Tom'].slice(0,opponents+1).map(name=>({name,stack:1000})),dealer:-1,hand:0,phase:'idle',actor:-1,board:[],log:[],pending:[],deck:[],result:[],currentBet:0,lastRaise:20}}
const next=(g,from,pred)=>{for(let k=1;k<=g.players.length;k++){const i=(from+k)%g.players.length;if(pred(g.players[i],i))return i}return -1};
const live=g=>g.players.map((p,i)=>i).filter(i=>!g.players[i].folded);
const able=p=>!p.folded&&p.stack>0;
function pay(g,i,n){const p=g.players[i],v=Math.max(0,Math.min(p.stack,n));p.stack-=v;p.bet+=v;p.total+=v;return v}
function log(g,t){g.log.push(t);g.log=g.log.slice(-50)}
export function startHand(g,rng=Math.random){
 if(!['idle','done'].includes(g.phase))throw new Error('Finish current hand first');
 if(g.players.filter(p=>p.stack>0).length<2)return false;
 g.dealer=next(g,g.dealer,p=>p.stack>0);g.hand++;g.phase='preflop';g.board=[];g.deck=shuffle(rng);g.result=[];g.log=[];g.currentBet=20;g.lastRaise=20;
 for(const p of g.players){p.folded=p.stack<=0;p.cards=[];p.bet=0;p.total=0;p.actedBet=null;p.action=p.folded?'Ausgeschieden':''}
 const players=live(g);for(let k=0;k<2;k++)for(const i of players)g.players[i].cards.push(g.deck.pop());
 const sb=players.length===2?g.dealer:next(g,g.dealer,p=>!p.folded),bb=next(g,sb,p=>!p.folded);g.sb=sb;g.bb=bb;
 pay(g,sb,10);pay(g,bb,20);g.players[sb].action='Small Blind 10';g.players[bb].action='Big Blind 20';
 g.pending=live(g).filter(i=>able(g.players[i]));g.actor=next(g,bb,(p,i)=>g.pending.includes(i));log(g,`Hand ${g.hand} · Blinds 10 / 20`);settle(g,bb);return true;
}
export function legal(g,i=g.actor){
 const p=g.players[i];if(!p||g.phase==='done'||i!==g.actor)return null;
 const call=Math.max(0,g.currentBet-p.bet),max=p.bet+p.stack;
 const reopened=p.actedBet===null||g.currentBet-p.actedBet>=g.lastRaise;
 return {call:Math.min(call,p.stack),toCall:call,max,min:g.currentBet+g.lastRaise,canRaise:reopened&&max>g.currentBet&&g.players.some((q,j)=>j!==i&&able(q)),check:call===0};
}
export function act(g,type,target){
 const i=g.actor,p=g.players[i],l=legal(g);if(!l)throw new Error('No active turn');
 if(type==='fold'){p.folded=true;p.action='Passt';log(g,`${p.name} passt`)}
 else if(type==='call'){const n=pay(g,i,l.toCall);p.action=n===0?'Check':p.stack===0?`All-in ${p.bet}`:`Mit ${n}`;log(g,`${p.name}: ${p.action}`)}
 else if(type==='raise'){
  if(!l.canRaise||!Number.isInteger(target)||target>l.max||target<=g.currentBet||(target<l.min&&target!==l.max))throw new Error('Invalid raise');
  const raise=target-g.currentBet,full=raise>=g.lastRaise;pay(g,i,target-p.bet);g.currentBet=target;
  if(full){g.lastRaise=raise;g.pending=g.players.map((q,j)=>j).filter(j=>j!==i&&able(g.players[j]));}
  p.action=p.stack===0?`All-in ${target}`:`Erhöht auf ${target}`;log(g,`${p.name}: ${p.action}`);
 }else throw new Error('Invalid action');
 p.actedBet=g.currentBet;g.pending=g.pending.filter(j=>j!==i&&able(g.players[j]));
 for(let j=0;j<g.players.length;j++)if(j!==i&&able(g.players[j])&&g.players[j].bet<g.currentBet&&!g.pending.includes(j))g.pending.push(j);
 settle(g,i);
}
function settle(g,after){
 const alive=live(g);if(alive.length===1){const i=alive[0],amount=g.players.reduce((s,p)=>s+p.total,0);g.players[i].stack+=amount;g.result=[{i,amount,label:'Alle anderen passen'}];g.phase='done';g.actor=-1;log(g,`${g.players[i].name} gewinnt ${amount}`);return}
 const can=alive.filter(i=>able(g.players[i]));
 // No betting into an empty side pot; the last player only has to match an outstanding wager.
 if(can.length<=1)g.pending=g.pending.filter(i=>g.players[i].bet<Math.max(...alive.filter(j=>j!==i).map(j=>g.players[j].bet)));
 if(g.pending.length){g.actor=next(g,after,(p,i)=>g.pending.includes(i));return}
 if(g.phase==='river'){showdown(g);return}
 g.deck.pop();const n=g.phase==='preflop'?3:1;for(let k=0;k<n;k++)g.board.push(g.deck.pop());
 g.phase={preflop:'flop',flop:'turn',turn:'river'}[g.phase];g.currentBet=0;g.lastRaise=20;
 for(const p of g.players){p.bet=0;p.actedBet=null;p.action=p.folded?'Passt':p.stack===0?'All-in':''}
 log(g,{flop:'Flop',turn:'Turn',river:'River'}[g.phase]);g.pending=alive.filter(i=>able(g.players[i]));
 if(can.length<=1){g.pending=[];settle(g,g.dealer)}else g.actor=next(g,g.dealer,(p,i)=>g.pending.includes(i));
}
export function showdown(g){
 const totals=[...new Set(g.players.map(p=>p.total).filter(Boolean))].sort((a,b)=>a-b),wins=new Map();let previous=0;
 const scores=g.players.map(p=>!p.folded?evaluate([...p.cards,...g.board]):null);
 for(const level of totals){const contributors=g.players.map((p,i)=>i).filter(i=>g.players[i].total>=level),amount=(level-previous)*contributors.length;previous=level;
  const eligible=contributors.filter(i=>!g.players[i].folded);if(!eligible.length)throw new Error('Pot without eligible player');
  let best=eligible[0];for(const i of eligible)if(compare(scores[i],scores[best])>0)best=i;
  const tied=eligible.filter(i=>compare(scores[i],scores[best])===0).sort((a,b)=>(a-g.dealer-1+g.players.length)%g.players.length-(b-g.dealer-1+g.players.length)%g.players.length);
  const share=Math.floor(amount/tied.length),rest=amount%tied.length;tied.forEach((i,k)=>wins.set(i,(wins.get(i)||0)+share+(k<rest?1:0)));
 }
 g.result=[...wins].map(([i,amount])=>({i,amount,label:HANDS[scores[i][0]]}));for(const r of g.result){g.players[r.i].stack+=r.amount;log(g,`${g.players[r.i].name} erhält ${r.amount} · ${r.label}`)}g.phase='done';g.actor=-1;
}
// Monte Carlo decision: only this bot's hole cards and the public board are used.
export function botAction(g,rng=Math.random){
 const i=g.actor,p=g.players[i],l=legal(g);if(!l)return;
 const known=[...p.cards,...g.board],remaining=Array.from({length:52},(_,i)=>i).filter(c=>!known.includes(c)),rivals=live(g).length-1;let equity=0;
 for(let trial=0;trial<65;trial++){
  const pool=remaining.slice(),draw=()=>pool.splice(Math.floor(rng()*pool.length),1)[0],board=g.board.slice();while(board.length<5)board.push(draw());
  const score=evaluate([...p.cards,...board]);let ties=1,win=true;
  for(let k=0;k<rivals;k++){const cmp=compare(evaluate([draw(),draw(),...board]),score);if(cmp>0)win=false;else if(cmp===0)ties++}if(win)equity+=1/ties;
 }
 equity/=65;const pot=g.players.reduce((s,q)=>s+q.total,0),odds=l.call/(pot+l.call||1),style=[.04,-.04,.08,-.02][(i-1)%4];
 if(l.call&&equity+style<odds+.035&&rng()>.12)return {type:'fold'};
 if(l.canRaise&&(equity+style>.65||rng()<.065)){
  const target=Math.min(l.max,Math.max(l.min,g.currentBet+Math.max(20,Math.round(pot*.55/10)*10)));
  if(target>=l.min||target===l.max)return {type:'raise',target};
 }
 return {type:'call'};
}
