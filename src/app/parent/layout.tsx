import type { ReactNode } from 'react';
import { ParentRewardDraftProvider } from '@/components/parent-reward-draft';
export default function ParentLayout({ children }: { children: ReactNode }) {
  return <ParentRewardDraftProvider>{children}</ParentRewardDraftProvider>;
}
