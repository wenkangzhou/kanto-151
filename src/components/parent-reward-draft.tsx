'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ParentReward } from '@/domain/types';
import { useCollection } from './collection-provider';
type Draft = {
  type: string; reason: string; result: ParentReward | null; busy: boolean; error: string; copied: boolean;
  request: { requestId: string; type: string; reason: string } | null;
};
const empty = (type: ParentReward['type']): Draft => ({ type, reason: '', result: null, busy: false, error: '', copied: false, request: null });
const Context = createContext<{ drafts: Record<ParentReward['type'], Draft>; patch: (type: ParentReward['type'], change: Partial<Draft>) => void } | null>(null);
function UnlockedDrafts({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState(() => ({ capture: empty('capture'), evolution: empty('evolution'), legendary: empty('legendary') }));
  return <Context.Provider value={{ drafts, patch: (type, change) => setDrafts(previous => ({ ...previous, [type]: { ...previous[type], ...change } })) }}>{children}</Context.Provider>;
}
export function ParentRewardDraftProvider({ children }: { children: ReactNode }) {
  const { parent, visitorDemo } = useCollection();
  // Only lives in the unlocked parent layout; never persists PINs or form data to storage.
  return parent ? <UnlockedDrafts key={String(visitorDemo)}>{children}</UnlockedDrafts> : children;
}
export function useParentRewardDraft(type: ParentReward['type']) {
  const context = useContext(Context);
  if (!context) throw new Error('奖励草稿只能在已解锁的家长空间中使用');
  return [context.drafts[type], (change: Partial<Draft>) => context.patch(type, change)] as const;
}
