import { Check, LockKeyhole, Sparkles } from 'lucide-react';
import type { CollectionState } from '@/domain/types';
export function CollectionMark({ state }: { state: CollectionState }) {
  return <span className={`collection-mark mark-${state}`} aria-hidden="true">{state === 'available' ? <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" fill="white" /><path d="M3 16a13 13 0 0 1 26 0Z" fill="#ee6755" /><circle cx="16" cy="16" r="13" stroke="#48545b" strokeWidth="2" /><path d="M3 16h26" stroke="#48545b" strokeWidth="2" /><circle cx="16" cy="16" r="4" fill="white" stroke="#48545b" strokeWidth="2" /></svg> : state === 'evolvable' ? <Sparkles size={21} /> : state === 'collected' ? <Check size={20} strokeWidth={3} /> : <LockKeyhole size={18} />}</span>;
}
