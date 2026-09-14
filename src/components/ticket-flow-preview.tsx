'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CollectionSnapshot, Pokemon, Receipt } from '@/domain/types';
import { Encounter } from './capture-experience';
import { TicketUse } from './ticket-use';

const createdAt = '2026-01-01T00:00:00.000Z';
const ticket = { id: 'local-preview-evolution-ticket', type: 'evolution' as const, reason: '今天认真完成了一件事', createdAt };
const snapshot: CollectionSnapshot = {
  records: [1, 4, 7, 133].map(pokemonId => ({ pokemonId, acquiredAt: createdAt, reason: '模拟伙伴', method: 'capture' })),
  team: [4], inventory: { evolution: 1, legendary: 0 }, source: 'demo',
};

/** In-memory only: uses the production gift, selection and animation components. */
export function TicketFlowPreview() {
  const [stage, setStage] = useState<'gift' | 'bag' | 'evolution'>('gift');
  const [target, setTarget] = useState<Pokemon | null>(null);
  const [run, setRun] = useState(0);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [stage, run]);
  const receipt: Receipt = {
    id: `local-ticket-flow-${run}-${stage}`, kind: stage === 'evolution' ? 'evolution' : 'evolution-ticket',
    pokemon_id: stage === 'evolution' ? target?.id ?? null : null,
    from_pokemon_id: stage === 'evolution' ? target?.evolvesFrom ?? null : null,
    ticket_id: ticket.id, created_at: createdAt, acknowledged_at: null, reason: ticket.reason,
  };
  return <div className="page">
    <p className="lesson-note" role="note">本地完整流程模拟 · 领取 1 张进化券 → 去背包 → 选伙伴 → 确认进化。只使用模拟伙伴和模拟券，不影响真实数据。进化结果页的详情、入队按钮不执行操作。</p>
    <nav className="preview-animation-tabs" aria-label="模拟流程控制">
      <Link href="/dev/capture">开球动画</Link><Link href="/dev/capture?mode=evolution">进化动画</Link>
      <button type="button" onClick={() => { setTarget(null); setStage('gift'); setRun(value => value + 1); }}>从领券重新开始</button>
    </nav>
    {stage === 'bag' ? <>
      <div className="page-heading"><div><h1>我的背包</h1><p>进化券 · 1 张</p></div></div>
      <TicketUse key={run} preview={{ snapshot, tickets: [ticket], onUse: selected => { setTarget(selected); setStage('evolution'); } }} />
    </> : <Encounter key={receipt.id} receipt={receipt} preview onPreviewContinue={stage === 'gift' ? () => setStage('bag') : undefined} />}
  </div>;
}
