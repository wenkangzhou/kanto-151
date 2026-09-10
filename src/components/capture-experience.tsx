'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Ticket, Gift, Mountain, Backpack, Hand, FastForward } from 'lucide-react';
import { playSceneSound, stopSceneSound } from '@/lib/scene-audio';
import { api } from '@/lib/api-client';
import { pokemonById, dexNumber } from '@/domain/pokemon';
import { legendaryEligible } from '@/domain/collection';
import type { Receipt } from '@/domain/types';
import { useCollection } from './collection-provider';
import { PokemonArt } from './pokemon-art';
import { ChapterDiscovery } from './chapter-discovery';
import { RewardKeypad } from './reward-keypad';
import { CollectionMark } from './collection-mark';
import { EncounterTeam } from './encounter-team';
import { PokeballLoader } from './pokeball-loader';
const captureStages = [
  ['silhouette', '草丛里有新的伙伴', 0], ['throw', '出发吧，精灵球！', 650], ['flash', '相遇的光芒', 1200],
  ['drop', '轻轻落下', 1600], ['shake-1', '晃了一下…', 2100], ['shake-2', '又晃了一下…', 2750],
  ['shake-3', '最后一下…', 3400], ['pause', '好像安静下来了', 4050], ['success', '捕捉成功！', 4500], ['reveal', '很高兴认识你！', 5000], ['completed', '新的伙伴加入了图鉴', 5700],
] as const;
const evolutionStages = [
  ['idle', '伙伴正在准备成长', 0], ['prepare', '奇妙的变化开始了', 400], ['glowing', '光芒一点点亮起来', 1100],
  ['silhouette-changing', '一个新的模样', 2300], ['flash', '成长的光芒', 3900], ['reveal', '你好，新的模样！', 4550], ['completed', '原来的伙伴也会一直在', 5500],
] as const;
function Encounter({ receipt }: { receipt: Receipt }) {
  const { refresh } = useCollection(); const router = useRouter(); const reduced = useReducedMotion();
  const evolution = receipt.kind === 'evolution'; const stages = evolution ? evolutionStages : captureStages;
  const [giftOpened, setGiftOpened] = useState(false);
  const [started, setStarted] = useState(false);
  useEffect(() => () => stopSceneSound(receipt.id), [receipt.id]);
  const [phase, setPhase] = useState(0); const [skipped, setSkipped] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const ticketOnly = receipt.pokemon_id === null;
  const stage = skipped || receipt.acknowledged_at ? 'completed' : ticketOnly ? giftOpened ? 'completed' : 'gift' : !started ? 'ready' : reduced ? 'completed' : stages[phase][0];
  const revealed = ['reveal', 'completed'].includes(stage);
  const target = receipt.pokemon_id ? pokemonById.get(receipt.pokemon_id)! : null;
  const before = receipt.from_pokemon_id ? pokemonById.get(receipt.from_pokemon_id)! : null;
  useEffect(() => {
    if (!started || skipped || reduced || receipt.acknowledged_at || ticketOnly) return;
    const timers = stages.slice(1).map((entry, index) => setTimeout(() => setPhase(index + 1), entry[2]));
    return () => timers.forEach(clearTimeout);
  }, [stages, started, skipped, reduced, receipt.acknowledged_at, ticketOnly]);
  useEffect(() => { if (revealed) void refresh(); }, [revealed, refresh]);
  async function finish() {
    if (busy) return; setBusy(true); setError('');
    try { await api('receipts/acknowledge', { id: receipt.id }); await refresh(); router.replace(target ? `/pokemon/${target.id}` : '/bag'); }
    catch (error) { setError(error instanceof Error ? error.message : '请重试。'); setBusy(false); }
  }
  const activeArt = evolution && before && ['idle', 'prepare', 'glowing'].includes(stage) ? before : target;
  return <section className={`encounter ${skipped || reduced || receipt.acknowledged_at ? 'encounter-quiet' : ''} ${ticketOnly ? 'gift-encounter' : evolution ? 'evolution-encounter' : 'capture-encounter'} ${receipt.kind === 'legendary' || receipt.kind === 'legendary-ticket' ? 'legendary-encounter' : ''} ${receipt.kind === 'mew' ? 'mew-encounter' : ''} phase-${stage}`}>
    <div className="encounter-heading"><span className="eyebrow">{receipt.kind === 'mew' ? '最后的奇迹' : evolution ? '伙伴长大啦' : ticketOnly ? '一份送给你的鼓励' : '今天的新伙伴'}</span>{!revealed && <button className="skip-animation" onClick={() => { stopSceneSound(receipt.id); setSkipped(true); }} aria-label="跳过动画，直接看奖励"><FastForward size={19} />跳过</button>}</div>
    <div className="encounter-stage">
      {(revealed || stage === 'success') && !reduced && !skipped && !receipt.acknowledged_at && <div className="encounter-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--piece-angle': `${index * 30}deg`, '--piece-color': ['#dabf72', '#97b596', '#b6a4ce', '#e5a897'][index % 4], '--piece-distance': `${85 + index % 3 * 25}px` } as CSSProperties} />)}</div>}
      {stage === 'ready' ? <button className="start-encounter" aria-label={evolution ? '开始进化' : '点精灵球，开始收服伙伴'} onClick={() => { playSceneSound(receipt.id, reduced ? evolution ? 'evolution-success' : 'capture-success' : evolution ? 'evolution' : 'capture'); setStarted(true); }}>{evolution && before ? <><PokemonArt pokemon={before} /><Sparkles className="start-evolution-spark" size={40} /></> : <CollectionMark state="available" />}<span className="start-touch"><Hand size={29} aria-hidden="true" />{evolution ? '变身！' : '点一下！'}</span></button> : ticketOnly ? revealed ? <div className={`revealed-gift-ticket ${receipt.kind === 'evolution-ticket' ? 'evolution' : 'legendary'}`} aria-label={receipt.kind === 'evolution-ticket' ? '一张进化券' : '一张传说券'}><span className="gift-ticket-emblem">{receipt.kind === 'evolution-ticket' ? <Sparkles size={55} /> : <Mountain size={55} />}</span><strong>{receipt.kind === 'evolution-ticket' ? '进化券' : '传说券'}</strong><span className="gift-ticket-count"><Ticket size={22} /> × 1</span></div> : <button className="open-gift" aria-label="打开奖励礼物，奖励已保存" onClick={() => { playSceneSound(receipt.id, 'gift'); setGiftOpened(true); }}><span className="gift-halo" aria-hidden="true" /><span className="gift-box" aria-hidden="true"><Gift size={100} strokeWidth={1.4} /><span className="gift-seal"><Sparkles size={27} /></span></span><span className="gift-touch-prompt">点我打开 <Sparkles size={20} /></span></button> : <div className="encounter-scenery" aria-hidden="true"><div className="encounter-ground" /><div className="evolution-aura" /><div className="encounter-flash" />{activeArt && <motion.div className="encounter-art" animate={revealed ? { scale: 1, opacity: 1 } : { scale: evolution && stage === 'glowing' ? 1.07 : 1, opacity: 1 }}><PokemonArt pokemon={activeArt} hidden={!revealed && (!evolution || ['silhouette-changing', 'flash'].includes(stage))} priority /></motion.div>}{!evolution && <div className="encounter-ball" key={stage}><div className="pokeball"><span className="pokeball-shine" /><span className="pokeball-button" /></div></div>}<Sparkles className="encounter-sparkle left" size={35} /><Sparkles className="encounter-sparkle right" size={25} /></div>}
    </div>
    <div className="encounter-copy" aria-live="polite">{revealed ? <><span className="success-label"><Check size={16} />{ticketOnly ? '奖励已放入背包' : '相遇已永久保存'}</span><h1>{target ? target.name : receipt.kind === 'evolution-ticket' ? '获得一张进化券' : '获得一张传说券'}</h1>{target && <><p className="mono">{dexNumber(target.id)} · {target.englishName}</p>{!receipt.acknowledged_at && <span className="discovery-stamp"><Sparkles size={20} /> 新伙伴 +1</span>}</>}{evolution && before && <div className="original-kept"><PokemonArt pokemon={before} /><Check size={19} /><span>{before.name}也会一直陪着你</span></div>}{receipt.completed_chapter && <ChapterDiscovery routeVersion={receipt.route_version} completed={receipt.completed_chapter} quiet={Boolean(skipped || reduced || receipt.acknowledged_at)} />}<p className="encounter-reason">「{receipt.reason || '一次值得记住的努力'}」</p>{target && stage === 'completed' && <EncounterTeam partner={target} previousId={evolution ? receipt.from_pokemon_id : null} disabled={busy} />}<button className="button encounter-next" disabled={busy} onClick={() => void finish()}>{target ? <PokemonArt pokemon={target} /> : <Backpack size={30} />}{busy ? '正在打开…' : target ? '认识它！' : '去背包' }<ArrowRight size={17} /></button></> : <><h2>{stage === 'ready' ? evolution ? '看看伙伴的新模样' : '新伙伴等着你！' : ticketOnly ? '里面藏着什么惊喜呢？' : stages[phase][1]}</h2></>}</div>{error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
export function CaptureExperience() {
  const { live, pendingReceipt, snapshot } = useCollection(); const router = useRouter(); const search = useSearchParams();
  const receiptId = search.get('receipt'); const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!receiptId || !live) return;
    const controller = new AbortController();
    api<Receipt>(`receipts/${encodeURIComponent(receiptId)}`, undefined, controller.signal).then(result => { if (!controller.signal.aborted) { setReceipt(result); setError(''); } }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [receiptId, live]);
  async function redeem(event: FormEvent) {
    event.preventDefault(); if (!live || busy || !/^[0-9]{6}$/.test(code)) return; setBusy(true); setError('');
    try { const result = await api<Receipt>('redeem', { code }); setReceipt(result); router.push(`/capture?receipt=${result.id}`); }
    catch (error) { setError(error instanceof Error ? error.message : '请重试。'); }
    finally { setBusy(false); }
  }
  async function mew() {
    if (busy) return; setBusy(true); setError('');
    try { const result = await api<Receipt>('mew', {}); setReceipt(result); router.push(`/capture?receipt=${result.id}`); }
    catch (error) { setError(error instanceof Error ? error.message : '请重试。'); }
    finally { setBusy(false); }
  }
  if (live && receiptId && receipt?.id === receiptId) return <div className="page"><Encounter key={receipt.id} receipt={receipt} /></div>;
  if (live && receiptId) return <div className="page">{error ? <div className="empty-state"><h2>暂时没有读到这次相遇</h2><p role="alert">{error}</p><button className="button" onClick={() => window.location.reload()}>重新读取已保存的结果</button><Link href="/capture" className="text-link">返回兑换入口</Link></div> : <PokeballLoader label="正在读取已经保存的相遇…" />}</div>;
  return <div className="page capture-entry"><div className="page-heading"><div><div className="eyebrow"><span /> YOUR EFFORT BECOMES A MEMORY</div><h1>一份努力，一次相遇<span className="title-dot">.</span></h1><p>把家长送给你的六位数字，变成一次新的成长。</p></div></div><section className="access-card redeem-card keypad-redeem-card"><span className="redeem-ball-emblem"><CollectionMark state="available" /></span><h2>打开奖励</h2>{!live && <p>当前是示例冒险，连接家庭后即可兑换。</p>}<form onSubmit={redeem} className="family-form"><RewardKeypad value={code} onChange={value => { setCode(value); setError(''); }} disabled={!live || busy} />{error && <p className="form-error" role="alert">{error}</p>}<button className={`button keypad-submit ${code.length === 6 ? 'ready' : ''}`} disabled={!live || busy || code.length !== 6}>{busy ? <><span className="keypad-saving-ball" aria-hidden="true"><span className="pokeball"><span className="pokeball-button" /></span></span>正在打开奖励…</> : <><CollectionMark state="available" />打开！<ArrowRight size={24} /></>}</button></form><details className="keypad-parent-note"><summary>家长输入提示</summary><p>也可以点数字格，用键盘或粘贴输入。网络中断后，用同一码重试会返回原来的结果。</p></details></section>{pendingReceipt && <Link href={`/capture?receipt=${pendingReceipt.id}`} className="pending-receipt"><Sparkles size={22} /><span>还有一份已经保存的惊喜，等你打开。</span><ArrowRight size={18} /></Link>}{live && legendaryEligible(151, snapshot) && <section className="mew-unlock"><Sparkles size={32} /><h2>150 位伙伴，让最后的奇迹醒来了</h2><p>这一次，不需要奖励码，也不需要传说券。</p><button className="button" disabled={busy} onClick={() => void mew()}>开启最后的相遇</button></section>}</div>;
}
