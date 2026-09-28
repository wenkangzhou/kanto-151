import data from '@/data/battle-learnsets.json';
import defaults from '@/data/battle-moves.json';
import type { PokemonType } from './types';
export type BattleMove = { id: string; name: string; type: PokemonType; category: 'physical' | 'special'; fallback?: boolean; level?: number };
export type MoveSlots = [string | null, string | null, string | null, string | null];
export type MovePresets = Record<string, MoveSlots>;
export const battleRules = data.meta;
export const struggle: BattleMove = { id: 'struggle', name: '挣扎', type: 'normal', category: 'physical', fallback: true };
const pools = data.pokemon as Record<string, { level: BattleMove[]; machine: BattleMove[] }>;
export function learnset(id: number) { return pools[id] ?? { level: [], machine: [] }; }
export function slotMoves(id: number, slot: number) { return slot >= 0 && slot < 4 ? learnset(id)[slot === 3 ? 'machine' : 'level'] : []; }
export function defaultSlots(id: number): MoveSlots {
  const moves = (defaults as Record<string, BattleMove[]>)[id] ?? [];
  const levelCount = Math.min(3, learnset(id).level.length);
  return [moves[0]?.fallback ? null : levelCount > 0 ? moves[0].id : null,
    levelCount > 1 ? moves[1].id : null, levelCount > 2 ? moves[2].id : null,
    moves[levelCount]?.fallback ? null : moves[levelCount]?.id ?? null];
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
    const available = slotMoves(id, slot);
    next[slot] = available.find(m => m.id === fallback[slot] && !next.includes(m.id))?.id ?? available.find(m => !next.includes(m.id))?.id ?? null;
  }
  return next;
}
export function battleMoves(id: number, saved?: unknown): BattleMove[] {
  const moves = resolvedSlots(id, saved).flatMap((move, slot) => slotMoves(id, slot).filter(m => m.id === move));
  return moves.length ? moves : [struggle];
}
