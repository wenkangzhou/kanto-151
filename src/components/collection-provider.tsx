'use client';
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { demoSnapshot, emptySnapshot } from '@/data/demo';
import type { CollectionSnapshot } from '@/domain/types';
const Context = createContext<{ snapshot: CollectionSnapshot; demo: boolean; toggleDemo: () => void }>({ snapshot: demoSnapshot, demo: true, toggleDemo: () => {} });
const subscribe = (callback: () => void) => { window.addEventListener('storage', callback); window.addEventListener('kanto-settings', callback); return () => { window.removeEventListener('storage', callback); window.removeEventListener('kanto-settings', callback); }; };
const getSnapshot = () => { try { return localStorage.getItem('kanto-preview') !== 'empty'; } catch { return true; } };
export function CollectionProvider({ children }: { children: ReactNode }) {
  const demo = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const toggleDemo = () => { try { localStorage.setItem('kanto-preview', demo ? 'empty' : 'demo'); window.dispatchEvent(new Event('kanto-settings')); } catch { /* Read-only browsers retain the example view. */ } };
  return <Context.Provider value={{ snapshot: demo ? demoSnapshot : emptySnapshot, demo, toggleDemo }}><MotionConfig reducedMotion="user">{children}</MotionConfig></Context.Provider>;
}
export const useCollection = () => useContext(Context);
