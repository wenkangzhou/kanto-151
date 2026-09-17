'use client';
import { useSyncExternalStore } from 'react';
import type { PokemonType } from '@/domain/types';
import type { CenterSort } from '@/domain/center';
const initial = { filter: 'all' as PokemonType | 'all', sort: 'recent' as CenterSort, y: 0 };
let current = initial;
const listeners = new Set<() => void>();
export function saveTeamView(patch: Partial<typeof initial>) {
  current = { ...current, ...patch };
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
// UI-only memory for this tab. It contains no family data or team mutations.
export function useTeamView() {
  return useSyncExternalStore(subscribe, () => current, () => initial);
}
