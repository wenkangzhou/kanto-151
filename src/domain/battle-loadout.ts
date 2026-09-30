import data from '@/data/battle-learnsets.json';
import defaults from '@/data/battle-moves.json';
import { pokemonById } from './pokemon';
import type { PokemonType } from './types';
export type BattleMove = { id: string; name: string; type: PokemonType; category: 'physical' | 'special'; fallback?: boolean; level?: number };
export type MoveSlots = [string | null, string | null, string | null, string | null];
export type MovePresets = Record<string, MoveSlots>;
export const battleRules = data.meta;
export const struggle: BattleMove = { id: 'struggle', name: '挣扎', type: 'normal', category: 'physical', fallback: true };
const pools = data.pokemon as Record<string, { level: BattleMove[]; machine: BattleMove[] }>;
export function learnset(id: number) { return pools[id] ?? { level: [], machine: [] }; }
export function slotMoves(id: number, slot: number) { return slot >= 0 && slot < 4 ? learnset(id)[slot >= 2 ? 'machine' : 'level'] : []; }
export function starterMachines(id: number): string[] {
  const p = pokemonById.get(id);
  const levels = learnset(id).level;
  const preferred = ((defaults as Record<string,BattleMove[]>)[id] ?? []).filter(m=>levels.some(l=>l.id===m.id)).slice(0,2).map(m=>m.id);
  const score = (m: BattleMove) => (p?.types.includes(m.type) ? 4 : 0) + (m.category === (p && p.stats.attack >= p.stats['special-attack'] ? 'physical' : 'special') ? 2 : 0);
  const candidates=[...learnset(id).machine].filter(m=>!preferred.includes(m.id)).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
  const first=candidates[0];if(!first)return [];
  const covered=new Set([...levels.filter(m=>preferred.includes(m.id)).map(m=>m.type),first.type]);
  const second=candidates.slice(1).sort((a,b)=>(covered.has(a.type)?1:0)-(covered.has(b.type)?1:0)||score(b)-score(a)||a.id.localeCompare(b.id))[0];
  return [first,...(second?[second]:[])].map(m=>m.id);
}
export function machineAvailable(id:number, move:string, unlocked:readonly string[]=[]) { return starterMachines(id).includes(move)||unlocked.includes(move); }
export function defaultSlots(id: number): MoveSlots {
  const moves = (defaults as Record<string, BattleMove[]>)[id] ?? [];
  const level = moves.filter(m=>learnset(id).level.some(l=>l.id===m.id)).slice(0,2);
  const machine = starterMachines(id);
  return [level[0]?.id??null,level[1]?.id??null,machine[0]??null,machine[1]??null];
}
export function validSlots(id: number, value: unknown): value is MoveSlots {
  if (!pools[id] || !Array.isArray(value) || value.length !== 4) return false;
  const ids = value.filter(move => move !== null);
  return new Set(ids).size === ids.length && value.every((move, slot) => move === null || typeof move === 'string' && slotMoves(id, slot).some(candidate => candidate.id === move));
}
// Only carry a move into a new form when its original slot source is still legal.
export function retainedSlots(id: number, saved: unknown): MoveSlots {
  const next: MoveSlots = [null, null, null, null];
  if (Array.isArray(saved) && saved.length === 4) saved.forEach((move, slot) => {
    if (typeof move === 'string' && !next.includes(move) && slotMoves(id, slot).some(m => m.id === move)) next[slot] = move;
  });
  return next;
}
// Revalidate persisted choices when the ruleset or a Pokémon's form changes.
export function resolvedSlots(id: number, saved?: unknown): MoveSlots {
  const fallback = defaultSlots(id);
  if (!Array.isArray(saved) || saved.length !== 4) return fallback;
  const next = retainedSlots(id,saved);
  for (let slot = 0; slot < 4; slot++) {
    if (next[slot] !== null) continue;
    const available = slotMoves(id, slot).filter(m=>slot<2||starterMachines(id).includes(m.id));
    next[slot] = available.find(m => m.id === fallback[slot] && !next.includes(m.id))?.id ?? available.find(m => !next.includes(m.id))?.id ?? null;
  }
  return next;
}
export function battleMoves(id: number, saved?: unknown): BattleMove[] {
  const moves = resolvedSlots(id, saved).flatMap((move, slot) => slotMoves(id, slot).filter(m => m.id === move));
  return moves.length ? moves : [struggle];
}
