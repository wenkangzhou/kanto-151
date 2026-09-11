'use client';
import { useSyncExternalStore } from 'react';
import { TYPE_NAMES } from '@/domain/types';
const key = 'kanto-dex-view-v1';
const initial = { query: '', filter: 'all', type: 'all', sort: 'number', y: 0, anchor: 0, offset: 0 };
type DexView = typeof initial;
let current: DexView | undefined;
const listeners = new Set<() => void>();
function read() {
  if (current) return current;
  current = initial;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (saved && typeof saved === 'object') current = {
      query: typeof saved.query === 'string' ? saved.query : '',
      filter: ['all','collected','evolvable','locked'].includes(saved.filter) ? saved.filter : 'all',
      type: saved.type === 'all' || saved.type in TYPE_NAMES ? saved.type : 'all',
      sort: saved.sort === 'recent' ? 'recent' : 'number',
      y: Number.isFinite(saved.y) ? Math.max(0, saved.y) : 0,
      anchor: Number.isInteger(saved.anchor) && saved.anchor >= 1 && saved.anchor <= 151 ? saved.anchor : 0,
      offset: Number.isFinite(saved.offset) ? saved.offset : 0,
    };
  } catch {}
  return current;
}
export function saveDexView(patch: Partial<DexView>) {
  current = { ...read(), ...patch };
  try { sessionStorage.setItem(key, JSON.stringify(current)); } catch {}
  listeners.forEach(listener => listener());
}
export function useDexView() {
  return useSyncExternalStore(subscribe, read, () => initial);
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
