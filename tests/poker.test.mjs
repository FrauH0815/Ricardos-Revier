import assert from 'node:assert/strict';
import {evaluate,compare,newSession,startHand,act,legal,showdown,shuffle,botAction} from '../games/poker-engine.mjs';
const c=(r,s=0)=>s*13+r-2;
assert.deepEqual(evaluate([c(14),c(2),c(3),c(4),c(5)]),[8,5]);
assert.deepEqual(evaluate([c(14),c(14,1),c(14,2),c(13),c(13,1),c(13,2),c(2)]),[6,14,13]);
assert.deepEqual(evaluate([c(10),c(10,1),c(10,2),c(10,3),c(14),c(3),c(2)]),[7,10,14]);
assert.deepEqual(evaluate([c(14),c(13),c(11),c(9),c(3),c(12,1),c(10,2)]),[5,14,13,11,9,3]);
assert.deepEqual(evaluate([c(14),c(2,1),c(3,2),c(4),c(5,1),c(13),c(12)]),[4,5]);
assert.equal(compare([1,14,13,12,8],[1,14,13,12,7]),1);
assert.equal(new Set(shuffle()).size,52);
// Side pots: shortest stack wins main pot, middle stack wins side pot, last gets unmatched chips back.
let g=newSession(2);g.board=[c(2),c(4,1),c(7,2),c(9,3),c(11)];
g.players.forEach((p,i)=>Object.assign(p,{stack:0,total:[100,200,300][i],folded:false,cards:[[c(14),c(14,1)],[c(13),c(13,1)],[c(12),c(12,1)]][i]}));showdown(g);assert.deepEqual(g.players.map(p=>p.stack),[300,200,100]);
// Board plays: split pot with odd chip left of dealer.
g=newSession(2);g.dealer=0;g.board=[c(10),c(11),c(12),c(13),c(14)];g.players.forEach((p,i)=>Object.assign(p,{stack:0,total:5,folded:i===2,cards:[c(2,i+1),c(3,i+1)]}));showdown(g);assert.deepEqual(g.players.map(p=>p.stack),[7,8,0]);
let seed=12;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
let hands=0,actions=0;
for(const opponents of [2,3,4])for(let session=0;session<30;session++){
 g=newSession(opponents);const bank=(opponents+1)*1000;
 for(let h=0;h<30;h++){
  if(!startHand(g,rng))break;hands++;let turn=0;
  while(g.phase!=='done'){
   assert.ok(++turn<300,'betting loop must terminate');const l=legal(g);assert.ok(l);const r=rng();
   if(r<.13&&l.toCall)act(g,'fold');
   else if(r<.40&&l.canRaise){const lo=Math.min(l.min,l.max);act(g,'raise',rng()<.25?l.max:Math.min(l.max,lo+Math.floor(rng()*4)*20))}
   else act(g,'call');actions++;
   assert.ok(g.players.every(p=>Number.isInteger(p.stack)&&p.stack>=0));
   if(g.phase!=='done')assert.equal(g.players.reduce((s,p)=>s+p.stack+p.total,0),bank);
   // Resume serialization must retain every detail.
   g=JSON.parse(JSON.stringify(g));
  }
  assert.equal(g.players.reduce((s,p)=>s+p.stack,0),bank,'chips must be conserved after every hand');
 }
}
// Repeated hands rotate dealer and allow a big blind option even after calls.
g=newSession(2);startHand(g,rng);assert.equal(g.actor,0);act(g,'call');act(g,'call');assert.equal(g.actor,g.bb);assert.equal(g.phase,'preflop');act(g,'call');assert.equal(g.phase,'flop');assert.equal(g.actor,1);
// A short all-in does not reopen a raise for a player who already acted.
g=newSession(2);startHand(g,rng);act(g,'raise',100);g.players[g.actor].stack=110;act(g,'raise',120);act(g,'call');assert.equal(g.actor,0);assert.equal(legal(g).canRaise,false);act(g,'call');assert.equal(g.phase,'flop');
console.log({hands,actions});
