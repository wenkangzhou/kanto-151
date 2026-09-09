'use client';
import { createContext, useCallback, useContext, useEffect, useState, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { demoSnapshot, emptySnapshot } from '@/data/demo';
import type { CollectionSnapshot, FamilySession, InventoryTicket, LiveSnapshot, Receipt } from '@/domain/types';
import { api } from '@/lib/api-client';
interface CollectionContext {
  snapshot: CollectionSnapshot; demo: boolean; live: boolean; toggleDemo: () => void;
  status: FamilySession['status'] | 'loading' | 'error'; error: string; parent: boolean;
  childName: string; familyName: string; tickets: InventoryTicket[]; pendingReceipt: Receipt | null;
  refresh: () => Promise<void>;
  saveTeam: (team: number[], expected: number[]) => Promise<void>;
}
const Context = createContext<CollectionContext>({ snapshot: emptySnapshot, demo: false, live: false, toggleDemo() {}, status: 'loading', error: '', parent: false, childName: '', familyName: '', tickets: [], pendingReceipt: null, async refresh() {}, async saveTeam() {} });
const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback); window.addEventListener('kanto-settings', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('kanto-settings', callback); };
};
const getPreference = () => { try { return localStorage.getItem('kanto-preview') !== 'empty'; } catch { return true; } };
export function CollectionProvider({ children, live = false }: { children: ReactNode; live?: boolean }) {
  const preference = useSyncExternalStore(subscribe, getPreference, () => true);
  const [session, setSession] = useState<FamilySession | null>(null);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const savingTeam = useRef(false);
  const refresh = useCallback(async () => {
    if (!live || savingTeam.current) return;
    const version = ++requestVersion.current;
    try { const next = await api<FamilySession>('session'); if (version === requestVersion.current) { setSession(next); setError(''); } }
    catch (error) { if (version === requestVersion.current) setError(error instanceof Error ? error.message : '暂时无法连接家庭手帐。'); }
  }, [live]);
  const saveTeam = useCallback(async (team: number[], expected: number[]) => {
    if (!live) throw new Error('示例模式只能看看伙伴，连接家庭后就能组队。');
    if (savingTeam.current) throw new Error('正在安排伙伴，请稍等。');
    savingTeam.current = true;
    ++requestVersion.current;
    try {
      const next = await api<LiveSnapshot>('team', { team, expected });
      setSession(previous => previous ? { ...previous, snapshot: next } : previous);
      setError('');
    } finally { savingTeam.current = false; }
  }, [live]);
  useEffect(() => {
    if (!live) return;
    const lock = () => setSession(previous => previous ? { ...previous, parent: false } : previous);
    const lost = () => setSession({ status: 'unpaired' });
    const focus = () => { void refresh(); };
    const controller = new AbortController();
    const version = ++requestVersion.current;
    api<FamilySession>('session', undefined, controller.signal)
      .then(next => { if (!controller.signal.aborted && version === requestVersion.current) { setSession(next); setError(''); } })
      .catch(error => { if (!controller.signal.aborted && version === requestVersion.current) setError(error instanceof Error ? error.message : '暂时无法连接家庭手帐。'); });
    window.addEventListener('focus', focus); window.addEventListener('online', focus);
    window.addEventListener('kanto-parent-locked', lock); window.addEventListener('kanto-device-lost', lost);
    return () => { controller.abort(); window.removeEventListener('focus', focus); window.removeEventListener('online', focus); window.removeEventListener('kanto-parent-locked', lock); window.removeEventListener('kanto-device-lost', lost); };
  }, [live, refresh]);
  useEffect(() => {
    if (!session?.parent || !session.parentExpiresAt) return;
    const timer = setTimeout(() => setSession(previous => previous ? { ...previous, parent: false } : previous), Math.max(0, session.parentExpiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session?.parent, session?.parentExpiresAt]);
  const toggleDemo = () => { if (live) return; try { localStorage.setItem('kanto-preview', preference ? 'empty' : 'demo'); window.dispatchEvent(new Event('kanto-settings')); } catch {} };
  const snapshot = live ? session?.snapshot ?? emptySnapshot : preference ? demoSnapshot : emptySnapshot;
  return <Context.Provider value={{ snapshot, demo: !live && preference, live, toggleDemo,
    status: !live ? 'demo' : error ? 'error' : session?.status ?? 'loading', error,
    parent: session?.parent ?? false, childName: session?.childName ?? '', familyName: session?.familyName ?? '',
    tickets: session?.snapshot?.tickets ?? [], pendingReceipt: session?.snapshot?.pendingReceipt ?? null, refresh, saveTeam,
  }}><MotionConfig reducedMotion="user">{children}</MotionConfig></Context.Provider>;
}
export const useCollection = () => useContext(Context);
