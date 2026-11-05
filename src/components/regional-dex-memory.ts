'use client';

import { useSyncExternalStore } from 'react';
import { TYPE_NAMES, type PokemonType } from '@/domain/types';

export type Region = 'johto' | 'hoenn';
export type Origin = 'all' | 'new' | 'kanto' | 'johto' | 'branch';
type RegionalDexView = {
  query: string;
  type: PokemonType | 'all';
  origin: Origin;
  y: number;
  anchor: number;
  offset: number;
  ready: boolean;
};

const initial: RegionalDexView = { query: '', type: 'all', origin: 'all', y: 0, anchor: 0, offset: 0, ready: false };
const current: Partial<Record<Region, RegionalDexView>> = {};
const listeners: Record<Region, Set<() => void>> = { johto: new Set(), hoenn: new Set() };
const key = (region: Region) => `${region}-dex-view-v1`;

function read(region: Region): RegionalDexView {
  if (current[region]) return current[region];
  let view: RegionalDexView = { ...initial, ready: true };
  try {
    const saved = JSON.parse(sessionStorage.getItem(key(region)) ?? 'null');
    if (saved && typeof saved === 'object') view = {
      query: typeof saved.query === 'string' ? saved.query : '',
      type: saved.type === 'all' || Object.prototype.hasOwnProperty.call(TYPE_NAMES, saved.type) ? saved.type : 'all',
      origin: (region === 'johto' ? ['all', 'new', 'kanto', 'branch'] : ['all', 'new', 'kanto', 'johto']).includes(saved.origin) ? saved.origin : 'all',
      y: Number.isFinite(saved.y) ? Math.max(0, saved.y) : 0,
      anchor: Number.isInteger(saved.anchor) && saved.anchor >= 1 && saved.anchor <= 386 ? saved.anchor : 0,
      offset: Number.isFinite(saved.offset) ? saved.offset : 0,
      ready: true,
    };
  } catch { /* A disabled or invalid session store only loses view memory. */ }
  current[region] = view;
  return view;
}

export function saveRegionalDexView(region: Region, patch: Partial<RegionalDexView>) {
  current[region] = { ...read(region), ...patch };
  try { sessionStorage.setItem(key(region), JSON.stringify(current[region])); } catch {}
  listeners[region].forEach(listener => listener());
}

export function useRegionalDexView(region: Region) {
  return useSyncExternalStore(
    listener => { listeners[region].add(listener); return () => { listeners[region].delete(listener); }; },
    () => read(region),
    () => initial,
  );
}
