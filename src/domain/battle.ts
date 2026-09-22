import moveData from '@/data/battle-moves.json';
import { pokemonById } from './pokemon';
import { effectiveness } from './effectiveness';
import type { PokemonType } from './types';
export type BattleMove = { id: string; name: string; type: PokemonType; category: 'physical' | 'special'; fallback?: boolean };
export const struggle: BattleMove = { id: 'struggle', name: '挣扎', type: 'normal', category: 'physical', fallback: true };
export function battleMoves(id: number): BattleMove[] { return (moveData as Record<string, BattleMove[]>)[id] ?? [struggle]; }
export function multiplier(move: BattleMove, target: number) { return move.fallback ? 1 : effectiveness(move.type, pokemonById.get(target)!.types); }
// Uniform level 50, neutral nature, no IVs/EVs; move power is normalized to 40.
export function maxHp(id: number) { return pokemonById.get(id)!.stats.hp + 60; }
export function healthPercent(id: number, hp: number) { return Math.max(0, Math.min(100, hp / maxHp(id) * 100)); }
export function damage(move: BattleMove, attacker: number, target: number) {
  const effect = multiplier(move, target);
  if (effect === 0) return 0;
  const physical = move.category === 'physical';
  const attack = pokemonById.get(attacker)!.stats[physical ? 'attack' : 'special-attack'] + 5;
  const defense = pokemonById.get(target)!.stats[physical ? 'defense' : 'special-defense'] + 5;
  return Math.max(1, Math.floor((22 * 40 * attack / defense / 50 + 2) * effect));
}
export function usableMoves(id: number, target: number) {
  const moves = battleMoves(id);
  return moves.every(move => multiplier(move, target) === 0) ? [...moves, struggle] : moves;
}
export function opponentPool(owned: number[]) {
  return [...new Set(owned)].filter(id => pokemonById.has(id));
}
// The caller supplies randomness at click time, never during React rendering.
export function pickOpponent(pool: number[], previous: number | undefined, random: number, seen: number[] = []): number | undefined {
  const alternatives = pool.filter(id => id !== previous);
  const fresh = alternatives.filter(id => !seen.includes(id));
  const candidates = fresh.length ? fresh : alternatives.length ? alternatives : pool;
  return candidates[Math.min(candidates.length - 1, Math.floor(Math.max(0, random) * candidates.length))];
}
export type BattleHit = { target: number; before: number; after: number };
export type BattleMoment = { move: BattleMove; target: number; multiplier: number };
export function firstAttacker(player: number, enemy: number, tieRandom: number): 'player' | 'enemy' {
  const difference = pokemonById.get(player)!.stats.speed - pokemonById.get(enemy)!.stats.speed;
  return difference > 0 ? 'player' : difference < 0 ? 'enemy' : tieRandom < .5 ? 'player' : 'enemy';
}
export type BattleState = { team: number[]; hp: Record<number, number>; enemy: number; enemyHp: number; active: number | null; first?: 'player' | 'enemy'; lastHit?: BattleHit; moment?: BattleMoment; phase: 'order' | 'player-feedback' | 'enemy-feedback' | 'summon' | 'choose' | 'ready' | 'player' | 'enemy' | 'finished'; message: string; move: BattleMove | null; rounds: number; result?: 'win' | 'rest' | 'draw' };
export function createBattle(team: number[], enemy: number): BattleState {
  const ids = [...new Set(team)].filter(id => pokemonById.has(id)).slice(0,6);
  return { team: ids, hp: Object.fromEntries(ids.map(id => [id,maxHp(id)])), enemy, enemyHp:maxHp(enemy), active:null, phase:'choose', message:'选一位伙伴出场吧！', move:null, rounds:0 };
}
export type BattleAction = { type:'choose'; id:number; tieRandom?:number } | { type:'attack'; moveId:string } | { type:'advance' };
const name = (id:number) => pokemonById.get(id)!.name;
function enemyTurn(s:BattleState):BattleState {
  const moves = usableMoves(s.enemy,s.active!);
  const move = moves[s.rounds % moves.length];
  return {...s,lastHit:undefined,phase:'enemy',move,message:`${name(s.enemy)}，${move.name}！`};
}
export function feedback(move:BattleMove,target:number) {
  const value=multiplier(move,target);
  return value===0?'这招没有效果，体力没有减少。':value>1?'这招很有效！':value<1?'效果不显著。':'打中了！';
}
export function battleReducer(s:BattleState,a:BattleAction):BattleState {
  if(s.phase==='finished')return s;
  if(a.type==='choose') {
    if((s.phase!=='choose'||s.active!==null)||!s.team.includes(a.id)||s.hp[a.id]<=0||a.id===s.active)return s;
    return {...s,active:a.id,first:firstAttacker(a.id,s.enemy,a.tieRandom??0),phase:'summon',message:`就决定是你了，${name(a.id)}！`,move:null};
  }
  if(a.type==='attack') {
    if(s.phase!=='ready'||s.active===null)return s;
    const move=usableMoves(s.active,s.enemy).find(m=>m.id===a.moveId);
    return move?{...s,lastHit:undefined,phase:'player',move,message:`${name(s.active)}，${move.name}！`}:s;
  }
  if(s.phase==='summon') {
    const first=s.first==='enemy'?s.enemy:s.active!;
    const equal=pokemonById.get(s.active!)!.stats.speed===pokemonById.get(s.enemy)!.stats.speed;
    return {...s,phase:'order',message:equal?`速度一样，这场${name(first)}先出招！`:`${name(first)}更快，先出招！`};
  }
  if(s.phase==='order')return s.first==='enemy'?enemyTurn(s):{...s,phase:'ready',message:'轮到你啦！'};
  if(s.phase==='player'&&s.move) {
    const enemyHp=Math.max(0,s.enemyHp-damage(s.move,s.active!,s.enemy));
    const value=multiplier(s.move,s.enemy);
    const moment=enemyHp<s.enemyHp&&(!s.moment||value>s.moment.multiplier)?{move:s.move,target:s.enemy,multiplier:value}:s.moment;
    return {...s,enemyHp,moment,lastHit:{target:s.enemy,before:s.enemyHp,after:enemyHp},phase:'player-feedback',message:feedback(s.move,s.enemy)};
  }
  if(s.phase==='player-feedback') {
    if(!s.enemyHp)return {...s,phase:'finished',result:'win',message:'配合得真棒！这场友好对战获胜啦！'};
    return s.first==='enemy'?finishRound(s):enemyTurn(s);
  }
  if(s.phase==='enemy'&&s.move&&s.active!==null) {
    const hp={...s.hp,[s.active]:Math.max(0,s.hp[s.active]-damage(s.move,s.enemy,s.active))};
    return {...s,hp,lastHit:{target:s.active,before:s.hp[s.active],after:hp[s.active]},phase:'enemy-feedback',message:feedback(s.move,s.active)};
  }
  if(s.phase==='enemy-feedback'&&s.active!==null) {
    const hp=s.hp;
    const rounds=s.rounds;
    if(hp[s.active]===0)return {...s,hp,rounds,phase:'finished',result:'rest',message:`对战结束，${name(s.enemy)}获胜！我们的伙伴也很努力，一起休息一下吧。`};
    return s.first==='enemy'?{...s,phase:'ready',message:'轮到你啦！'}:finishRound(s);
  }
  return s;
}

function finishRound(s: BattleState): BattleState {
  const next={...s,rounds:s.rounds+1};
  if(next.rounds>=24)return {...next,phase:'finished',result:'draw',message:'双方都很努力！这次握手言和吧。'};
  return next.first==='enemy'?enemyTurn(next):{...next,phase:'ready',message:'轮到你啦！'};
}

// Each challenge starts with fresh HP and turn order; only the chosen partner carries over.
export function createNextBattle(team:number[], enemy:number, partner?:number, tieRandom=0):BattleState {
  const fresh=createBattle(team,enemy);
  if(partner===undefined)return fresh;
  const next=battleReducer(fresh,{type:'choose',id:partner,tieRandom});
  return next.active===null?next:{...next,message:pokemonById.get(enemy)!.name};
}
