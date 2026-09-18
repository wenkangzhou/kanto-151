'use client';
import Link from 'next/link';
import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from 'react';
import { speakText, stopVoice, subscribeVoice, voiceSnapshot, voiceServerSnapshot } from '@/lib/voice-audio';
import { ArrowRight, Ticket, Sparkles, Mountain } from 'lucide-react';
import { useCollection } from './collection-provider';
import { evolutionOptions, legendaryEligible } from '@/domain/collection';
import { pokemonById } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';
import { CollectionMark } from './collection-mark';
import { TicketUse } from './ticket-use';
import type { InventoryTicket } from '@/domain/types';
function ItemVoice({ name, text, children }: { name: string; text: string; children: ReactNode }) {
  const owner = useId();
  const state = useSyncExternalStore(subscribeVoice, voiceSnapshot, voiceServerSnapshot);
  const playing = state.owner === owner;
  useEffect(() => () => stopVoice(owner), [owner]);
  return <button type="button" className="bag-item-picture" aria-label={playing ? `停止介绍${name}` : `听听${name}的用途`} aria-pressed={playing} onClick={() => speakText(owner, text)}>{children}</button>;
}
export function Bag() {
  const { snapshot, live, pendingReceipt } = useCollection();
  const [useIntent, setUseIntent] = useState<{type: InventoryTicket['type']; key: number} | null>(null);
  const openTickets = (type: InventoryTicket['type']) => setUseIntent(previous => ({type, key: (previous?.key ?? 0) + 1}));
  const balls = pendingReceipt?.kind === 'capture' && !pendingReceipt.acknowledged_at ? 1 : 0;
  const options = evolutionOptions(snapshot);
  const parents = [...new Set(options.map(p => p.evolvesFrom!))];
  return <div className="page bag-page"><div className="page-heading"><div><div className="eyebrow"><span /> GOOD THINGS IN YOUR POCKET</div><h1>装着惊喜的小背包<span className="title-dot">.</span></h1><p>每一张券，都来自一次了不起的努力。</p></div></div>
    <p className="bag-listen-hint">点点道具图片，听听它能做什么。</p>
    <div className="ticket-grid bag-items">
      <section className="inventory-ticket ball-ticket">
        <ItemVoice name="精灵球" text="精灵球，里面藏着一位新伙伴。拿到奖励后，打开精灵球，就能和它见面啦。"><CollectionMark state="available" /></ItemVoice>
        <h2>精灵球 <strong>{balls}<small> 个待打开</small></strong></h2>
        <p>打开精灵球，认识新伙伴。</p>
        <span className="ticket-status">{balls ? '有一位伙伴正在等你' : '拿到奖励后，就能打开精灵球啦'}</span>
        {live && balls > 0 && <Link className="text-link" href={`/capture?receipt=${encodeURIComponent(pendingReceipt!.id)}`}>打开精灵球 <ArrowRight size={19} /></Link>}
      </section>
      <section className="inventory-ticket evolution-ticket">
        <ItemVoice name="进化券" text="进化券，可以让一位伙伴长成新的模样。先选一张券，再选一位可以进化的伙伴。原来的伙伴也会留下来哦。"><Ticket size={56} aria-hidden="true" /></ItemVoice>
        <h2>进化券 <strong>{snapshot.inventory.evolution}<small> 张</small></strong></h2>
        <p>让伙伴长成新的模样，原来的它也会留下。</p>
        <span className="ticket-status">{snapshot.source === 'demo' ? '示例库存 · 暂不可使用' : snapshot.inventory.evolution ? '准备好时，再选伙伴进化' : '还没有进化券，拿到后再来选伙伴吧'}</span>
        {live && snapshot.inventory.evolution > 0 && <button className="text-link" onClick={() => openTickets('evolution')}>选伙伴进化 <ArrowRight size={19} /></button>}
      </section>
      <section className="inventory-ticket legendary-ticket">
        <ItemVoice name="传说券" text="传说券，可以用来认识传说中的伙伴。先在冒险中认识更多伙伴，等下面的进度满了，就能用券去见它啦。"><Sparkles size={56} aria-hidden="true" /></ItemVoice>
        <h2>传说券 <strong>{snapshot.inventory.legendary}<small> 张</small></strong></h2>
        <p>认识更多伙伴，开启特别的传说相遇。</p>
        <span className="ticket-status">{snapshot.source === 'demo' ? '示例库存 · 暂不可使用' : snapshot.inventory.legendary ? '奖励会保留，准备好时再使用' : '还没有传说券，先和伙伴们继续冒险吧'}</span>
        {live && snapshot.inventory.legendary > 0 && <button className="text-link" onClick={() => openTickets('legendary')}>选择传说伙伴 <ArrowRight size={19} /></button>}
      </section>
    </div>
    <TicketUse key={useIntent?.key ?? 0} initialType={useIntent?.type} /><section className="detail-panel"><div className="section-heading"><h2><Sparkles size={19} /> 可以迎接进化的伙伴</h2><span className="muted">{parents.length} 位伙伴</span></div>{parents.length ? <div className="evolution-eligible">{parents.map(id => { const p = pokemonById.get(id)!; return <Link href={`/pokemon/${id}?from=bag`} key={id}><PokemonArt pokemon={p} /><div><strong>{p.name}</strong><small>{options.filter(option => option.evolvesFrom === id).length} 个未收集的新形态</small></div><ArrowRight size={17} /></Link>; })}</div> : <p className="strength-summary">先与新伙伴相遇吧。可以进化的伙伴会出现在这里。</p>}<p className="panel-footnote">一张进化券只增加一个新形态。原来的伙伴与它的相遇记忆都会保留。</p></section>
    <section className="detail-panel"><div className="section-heading"><h2><Mountain size={19} /> 远方的传说</h2></div><div className="legendary-picture-grid">{[144, 145, 146, 150, 151].map((id, index) => {
      const partner = pokemonById.get(id)!;
      const known = snapshot.records.some(record => record.pokemonId === id);
      const eligible = legendaryEligible(id, snapshot);
      const required = [60, 80, 100, 140, 150][index];
      return <Link className={`legendary-picture ${eligible ? 'ready' : ''}`} href={id === 151 && eligible ? '/capture' : `/pokemon/${id}?from=bag`} key={id}>
        <div className="legendary-picture-top"><span className="mono">#{id}</span><CollectionMark state={known ? 'collected' : eligible ? 'available' : 'locked'} /></div>
        <PokemonArt pokemon={partner} hidden={!known} /><strong>{known ? partner.name : id === 151 ? '最后的奇迹' : '远方的神秘伙伴'}</strong>
        <span className="legendary-picture-status">{known ? '已相遇' : eligible ? id === 151 ? '点我开启相遇' : '可以用传说券啦' : '还在等你'}</span>
        {!known && <><div className="legendary-count"><span>{Math.min(snapshot.records.length, required)} / {required} 位伙伴</span><div role="progressbar" aria-label={`传说 ${id} 的收集进度`} aria-valuenow={Math.min(snapshot.records.length, required)} aria-valuemin={0} aria-valuemax={required}><span style={{ width: `${Math.min(100, snapshot.records.length / required * 100)}%` }} /></div></div><small>{id === 151 ? '集齐前 150 位 · 不用券' : id === 150 ? '还需完成故事 · 用传说券' : '用一张传说券相遇'}</small></>}
      </Link>;
    })}</div></section>
  </div>;
}
