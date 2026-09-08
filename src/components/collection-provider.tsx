'use client';
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { demoSnapshot, emptySnapshot } from '@/data/demo';
import type { CollectionSnapshot, FamilySession, InventoryTicket, Receipt } from '@/domain/types';
import { api } from '@/lib/api-client';
interface CollectionContext {
  snapshot: CollectionSnapshot; demo: boolean; live: boolean; toggleDemo: () => void;
  status: FamilySession['status'] | 'loading' | 'error'; error: string; parent: boolean;
  childName: string; familyName: string; tickets: InventoryTicket[]; pendingReceipt: Receipt | null;
  refresh: () => Promise<void>;
}
const Context = createContext<CollectionContext>({ snapshot: emptySnapshot, demo: false, live: false, toggleDemo() {}, status: 'loading', error: '', parent: false, childName: '', familyName: '', tickets: [], pendingReceipt: null, async refresh() {} });
const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback); window.addEventListener('kanto-settings', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('kanto-settings', callback); };
};
const getPreference = () => { try { return localStorage.getItem('kanto-preview') !== 'empty'; } catch { return true; } };
export function CollectionProvider({ children, live = false }: { children: ReactNode; live?: boolean }) {
  const preference = useSyncExternalStore(subscribe, getPreference, () => true);
  const [session, setSession] = useState<FamilySession | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!live) return;
    try { const next = await api<FamilySession>('session'); setSession(next); setError(''); }
    catch (error) { setError(error instanceof Error ? error.message : '暂时无法连接家庭手帐。'); }
  }, [live]);
  useEffect(() => {
    if (!live) return;
    const lock = () => setSession(previous => previous ? { ...previous, parent: false } : previous);
    const lost = () => setSession({ status: 'unpaired' });
    const focus = () => { void refresh(); };
    const controller = new AbortController();
    api<FamilySession>('session', undefined, controller.signal)
      .then(next => { if (!controller.signal.aborted) { setSession(next); setError(''); } })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '暂时无法连接家庭手帐。'); });
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
    tickets: session?.snapshot?.tickets ?? [], pendingReceipt: session?.snapshot?.pendingReceipt ?? null, refresh,
  }}><MotionConfig reducedMotion="user">{children}</MotionConfig></Context.Provider>;
}
export const useCollection = () => useContext(Context);
