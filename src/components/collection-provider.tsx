'use client';
import { useT } from '@/lib/i18n/locale';

import type { MoveSlots } from '@/domain/battle-loadout';
import { createContext, useCallback, useContext, useEffect, useState, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { demoSnapshot, emptySnapshot } from '@/data/demo';
import type { CollectionSnapshot, FamilySession, InventoryTicket, LiveSnapshot, Receipt } from '@/domain/types';
import { isVisitorDemo } from '@/lib/demo-mode';
import { api } from '@/lib/api-client';
import { LatestRead } from '@/lib/latest-read';
interface CollectionContext {
  snapshot: CollectionSnapshot; visitorDemo: boolean; demo: boolean; live: boolean; toggleDemo: () => void;
  status: FamilySession['status'] | 'loading' | 'error'; error: string; parent: boolean;
  childName: string; familyName: string; tickets: InventoryTicket[]; pendingReceipt: Receipt | null; pendingCaptures: Receipt[];
  refresh: () => Promise<void>;
  saveMoves: (id: number, moves: MoveSlots, expected: MoveSlots | null) => Promise<void>;
  saveTeam: (team: number[], expected: number[]) => Promise<void>;
}
const Context = createContext<CollectionContext>({ snapshot: emptySnapshot, visitorDemo: false, demo: false, live: false, toggleDemo() {}, status: 'loading', error: '', parent: false, childName: '', familyName: '', tickets: [], pendingReceipt: null, pendingCaptures: [], async refresh() {}, async saveTeam() {}, async saveMoves() {} });
const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback); window.addEventListener('kanto-settings', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('kanto-settings', callback); };
};
const getPreference = () => { try { return localStorage.getItem('kanto-preview') !== 'empty'; } catch { return true; } };
export function CollectionProvider({ children, live: configuredLive = false }: { children: ReactNode; live?: boolean }) {
  const localize = useT();
  const visitorDemo = useSyncExternalStore(subscribe, isVisitorDemo, () => false);
  const live = configuredLive || visitorDemo;
  const preference = useSyncExternalStore(subscribe, getPreference, () => true);
  const [session, setSession] = useState<FamilySession | null>(null);
  const [error, setError] = useState('');
  const reads = useRef(new LatestRead());
  const savingTeam = useRef(false);
  const refresh = useCallback(async (force = true) => {
    if (!live || savingTeam.current) return;
    if (force) reads.current.invalidate();
    await reads.current.run(
      () => api<FamilySession>('session'),
      next => { setSession(next); setError(''); },
      error => setError(error instanceof Error ? error.message : '暂时无法连接家庭手帐。'),
    );
  }, [live]);
  const saveTeam = useCallback(async (team: number[], expected: number[]) => {
    if (!live) throw new Error('示例模式只能看看伙伴，连接家庭后就能组队。');
    if (savingTeam.current) throw new Error('正在安排伙伴，请稍等。');
    savingTeam.current = true;
    reads.current.invalidate();
    const token = reads.current.token();
    try {
      const next = await api<LiveSnapshot>('team', { team, expected });
      if (!reads.current.isCurrent(token)) return;
      setSession(previous => previous ? { ...previous, snapshot: { ...next, pendingCaptures: previous.snapshot?.pendingCaptures } } : previous);
      setError('');
    } finally { savingTeam.current = false; void refresh(); }
  }, [live, refresh]);
  const saveMoves = useCallback(async (id:number, moves:MoveSlots, expected:MoveSlots|null) => {
    if (!live) throw new Error('请先连接家庭或进入演示模式。');
    if (savingTeam.current) throw new Error('正在保存，请稍等。');
    savingTeam.current=true; reads.current.invalidate();
    const token = reads.current.token();
    try {
      const next=await api<LiveSnapshot>('battle/moves',{pokemonId:id,moves,expected});
      if (!reads.current.isCurrent(token)) return;
      setSession(previous=>previous?{...previous,snapshot:{...next,pendingCaptures:previous.snapshot?.pendingCaptures}}:previous);setError('');
    } finally { savingTeam.current=false; void refresh(); }
  },[live, refresh]);
  useEffect(() => {
    if (!live) return;
    const lock = () => {
      reads.current.invalidate();
      setSession(previous => previous ? { ...previous, parent: false } : previous);
    };
    const lost = () => {
      reads.current.invalidate();
      setSession({ status: 'unpaired' });
      setError('');
    };
    const focus = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void refresh(false);
    };
    reads.current.invalidate();
    void refresh(false);
    const interval = window.setInterval(focus, 60_000);
    window.addEventListener('focus', focus); window.addEventListener('online', focus);
    document.addEventListener('visibilitychange', focus);
    window.addEventListener('kanto-parent-locked', lock); window.addEventListener('kanto-device-lost', lost);
    return () => {
      reads.current.invalidate();
      window.clearInterval(interval);
      window.removeEventListener('focus', focus); window.removeEventListener('online', focus);
      document.removeEventListener('visibilitychange', focus);
      window.removeEventListener('kanto-parent-locked', lock); window.removeEventListener('kanto-device-lost', lost);
    };
  }, [live, refresh]);
  useEffect(() => {
    if (!session?.parent || !session.parentExpiresAt) return;
    const timer = setTimeout(() => setSession(previous => previous ? { ...previous, parent: false } : previous), Math.max(0, session.parentExpiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session?.parent, session?.parentExpiresAt]);
  const toggleDemo = () => { if (live) return; try { localStorage.setItem('kanto-preview', preference ? 'empty' : 'demo'); window.dispatchEvent(new Event('kanto-settings')); } catch {} };
  const snapshot = live ? session?.snapshot ?? emptySnapshot : preference ? demoSnapshot : emptySnapshot;
  return <Context.Provider value={{ snapshot, visitorDemo, demo: !live && preference, live, toggleDemo,
    status: !live ? 'demo' : session?.status === 'ready' ? 'ready' : error ? 'error' : session?.status ?? 'loading', error,
    parent: session?.parent ?? false, childName: session?.childName ?? '', familyName: session?.familyName ?? '',
    pendingCaptures: session?.snapshot?.pendingCaptures ?? [], tickets: session?.snapshot?.tickets ?? [], pendingReceipt: session?.snapshot?.pendingReceipt ?? null, refresh, saveTeam, saveMoves,
  }}><MotionConfig reducedMotion="user">{localize(children)}</MotionConfig></Context.Provider>;
}
export const useCollection = () => useContext(Context);
