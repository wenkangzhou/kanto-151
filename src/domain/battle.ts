import moveData from '@/data/battle-moves.json';
import { pokemonById } from './pokemon';
import { effectiveness } from './effectiveness';
import type { PokemonType } from './types';
export type BattleMove = { id: string; name: string; type: PokemonType; fallback?: boolean };
export const struggle: BattleMove = { id: 'struggle', name: '挣扎', type: 'normal', fallback: true };
export function battleMoves(id: number): BattleMove[] { return (moveData as Record<string, BattleMove[]>)[id] ?? [struggle]; }
export function multiplier(move: BattleMove, target: number) { return move.fallback ? 1 : effectiveness(move.type, pokemonById.get(target)!.types); }
export function damage(move: BattleMove, target: number) { return Math.round(18 * multiplier(move, target)); }
export function usableMoves(id: number, target: number) {
  const moves = battleMoves(id);
  return moves.every(move => multiplier(move, target) === 0) ? [...moves, struggle] : moves;
}
export function opponentPool(owned: number[], team: number[]) {
  const average = team.reduce((n, id) => n + Object.values(pokemonById.get(id)!.stats).reduce((a, b) => a + b, 0), 0) / Math.max(1, team.length);
  return [...new Set(owned)].filter(id => pokemonById.has(id)).sort((a, b) => {
    const score = (id: number) => Math.abs(Object.values(pokemonById.get(id)!.stats).reduce((x,y) => x+y,0)-average);
    return score(a)-score(b);
  }).slice(0, 6);
}
// The caller supplies randomness at click time, never during React rendering.
export function pickOpponent(pool: number[], previous: number | undefined, random: number): number | undefined {
  const alternatives = pool.filter(id => id !== previous);
  const candidates = alternatives.length ? alternatives : pool;
  return candidates[Math.min(candidates.length - 1, Math.floor(Math.max(0, random) * candidates.length))];
}
export type BattleState = { team: number[]; hp: Record<number, number>; enemy: number; enemyHp: number; active: number | null; afterSummon?: 'ready' | 'enemy'; phase: 'summon' | 'choose' | 'ready' | 'player' | 'enemy' | 'finished'; message: string; move: BattleMove | null; rounds: number; result?: 'win' | 'rest' | 'draw' };
export function createBattle(team: number[], enemy: number): BattleState {
  const ids = [...new Set(team)].filter(id => pokemonById.has(id)).slice(0,6);
  return { team: ids, hp: Object.fromEntries(ids.map(id => [id,100])), enemy, enemyHp:100, active:null, phase:'choose', message:'选一位伙伴出场吧！', move:null, rounds:0 };
}
export type BattleAction = { type:'choose'; id:number } | { type:'attack'; moveId:string } | { type:'advance' };
const name = (id:number) => pokemonById.get(id)!.name;
function enemyTurn(s:BattleState):BattleState {
  const moves = usableMoves(s.enemy,s.active!);
  const move = moves[s.rounds % moves.length];
  return {...s,phase:'enemy',move,message:`${name(s.enemy)}，${move.name}！`};
}
export function feedback(move:BattleMove,target:number) {
  const value=multiplier(move,target);
  return value===0?'这招没有效果，体力没有减少。':value>1?'这招很有效！':value<1?'效果不显著。':'打中了！';
}
export function battleReducer(s:BattleState,a:BattleAction):BattleState {
  if(s.phase==='finished')return s;
  if(a.type==='choose') {
    if(!['choose','ready'].includes(s.phase)||!s.team.includes(a.id)||s.hp[a.id]<=0||a.id===s.active)return s;
    return {...s,active:a.id,phase:'summon',afterSummon:s.phase==='ready'?'enemy':'ready',message:`就决定是你了，${name(a.id)}！`,move:null};
  }
  if(a.type==='attack') {
    if(s.phase!=='ready'||s.active===null)return s;
    const move=usableMoves(s.active,s.enemy).find(m=>m.id===a.moveId);
    return move?{...s,phase:'player',move,message:`${name(s.active)}，${move.name}！`}:s;
  }
  if(s.phase==='summon')return s.afterSummon==='enemy'?enemyTurn(s):{...s,phase:'ready'};
  if(s.phase==='player'&&s.move) {
    const enemyHp=Math.max(0,s.enemyHp-damage(s.move,s.enemy));
    if(!enemyHp)return {...s,enemyHp,phase:'finished',result:'win',message:'配合得真棒！这场友好对战获胜啦！'};
    return {...enemyTurn({...s,enemyHp}),message:`${feedback(s.move,s.enemy)} ${name(s.enemy)}准备出招了！`};
  }
  if(s.phase==='enemy'&&s.move&&s.active!==null) {
    const hp={...s.hp,[s.active]:Math.max(0,s.hp[s.active]-damage(s.move,s.active))};
    const rounds=s.rounds+1;
    if(s.team.every(id=>hp[id]===0))return {...s,hp,rounds,phase:'finished',result:'rest',message:`对战结束，${name(s.enemy)}获胜！我们的伙伴也很努力，一起休息一下吧。`};
    if(rounds>=24)return {...s,hp,rounds,phase:'finished',result:'draw',message:'双方都很努力！这次握手言和吧。'};
    return {...s,hp,rounds,phase:hp[s.active]===0?'choose':'ready',message:hp[s.active]===0?`${name(s.active)}休息一下吧，换一位伙伴！`:`${name(s.enemy)}用了${s.move.name}。${feedback(s.move,s.active)} 轮到你啦！`};
  }
  return s;
}
