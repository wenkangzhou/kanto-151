'use client';
import Link from 'next/link';
import { ArrowRight, Ticket, Sparkles, Mountain } from 'lucide-react';
import { useCollection } from './collection-provider';
import { evolutionOptions, legendaryEligible } from '@/domain/collection';
import { pokemonById } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';
import { CollectionMark } from './collection-mark';
import { TicketUse } from './ticket-use';
export function Bag() {
  const { snapshot, live } = useCollection();
  const options = evolutionOptions(snapshot);
  const parents = [...new Set(options.map(p => p.evolvesFrom!))];
  return <div className="page bag-page"><div className="page-heading"><div><div className="eyebrow"><span /> GOOD THINGS IN YOUR POCKET</div><h1>装着惊喜的小背包<span className="title-dot">.</span></h1><p>每一张券，都来自一次了不起的努力。</p></div></div>
    <div className="ticket-grid"><section className="inventory-ticket evolution-ticket"><Ticket size={35} /><span className="eyebrow">A CHANCE TO GROW</span><h2>进化券 <strong>{snapshot.inventory.evolution}<small> 张</small></strong></h2><p>让一位伙伴长成新的模样。<br />原来的它，会继续留在图鉴里。</p><span className="ticket-status">{snapshot.source === 'demo' ? '示例库存 · 暂不可使用' : '奖励会一直保留，准备好时再使用'}</span>{live && snapshot.inventory.evolution > 0 && <a className="text-link" href="#use-ticket">选一张券 <ArrowRight size={19} /></a>}</section><section className="inventory-ticket legendary-ticket"><Sparkles size={35} /><span className="eyebrow">SOMETHING EXTRAORDINARY</span><h2>传说券 <strong>{snapshot.inventory.legendary}<small> 张</small></strong></h2><p>当图鉴积累足够多的伙伴，<br />开启一次特别的传说相遇。</p><span className="ticket-status">{snapshot.source === 'demo' ? '示例库存 · 暂不可使用' : '奖励会一直保留，准备好时再使用'}</span>{live && snapshot.inventory.legendary > 0 && <a className="text-link" href="#use-ticket">选一张券 <ArrowRight size={19} /></a>}</section></div>
    <TicketUse /><section className="detail-panel"><div className="section-heading"><h2><Sparkles size={19} /> 可以迎接进化的伙伴</h2><span className="muted">{parents.length} 位伙伴</span></div>{parents.length ? <div className="evolution-eligible">{parents.map(id => { const p = pokemonById.get(id)!; return <Link href={`/pokemon/${id}`} key={id}><PokemonArt pokemon={p} /><div><strong>{p.name}</strong><small>{options.filter(option => option.evolvesFrom === id).length} 个未收集的新形态</small></div><ArrowRight size={17} /></Link>; })}</div> : <p className="strength-summary">先与新伙伴相遇吧。可以进化的伙伴会出现在这里。</p>}<p className="panel-footnote">一张进化券只增加一个新形态。原来的伙伴与它的相遇记忆都会保留。</p></section>
    <section className="detail-panel"><div className="section-heading"><h2><Mountain size={19} /> 远方的传说</h2></div><div className="legendary-picture-grid">{[144, 145, 146, 150, 151].map((id, index) => {
      const partner = pokemonById.get(id)!;
      const known = snapshot.records.some(record => record.pokemonId === id);
      const eligible = legendaryEligible(id, snapshot);
      const required = [60, 80, 100, 140, 150][index];
      return <Link className={`legendary-picture ${eligible ? 'ready' : ''}`} href={id === 151 && eligible ? '/capture' : `/pokemon/${id}`} key={id}>
        <div className="legendary-picture-top"><span className="mono">#{id}</span><CollectionMark state={known ? 'collected' : eligible ? 'available' : 'locked'} /></div>
        <PokemonArt pokemon={partner} hidden={!known} /><strong>{known ? partner.name : id === 151 ? '最后的奇迹' : '远方的神秘伙伴'}</strong>
        <span className="legendary-picture-status">{known ? '已相遇' : eligible ? id === 151 ? '点我开启相遇' : '可以用传说券啦' : '还在等你'}</span>
        {!known && <><div className="legendary-count"><span>{Math.min(snapshot.records.length, required)} / {required} 位伙伴</span><div role="progressbar" aria-label={`传说 ${id} 的收集进度`} aria-valuenow={Math.min(snapshot.records.length, required)} aria-valuemin={0} aria-valuemax={required}><span style={{ width: `${Math.min(100, snapshot.records.length / required * 100)}%` }} /></div></div><small>{id === 151 ? '集齐前 150 位 · 不用券' : id === 150 ? '还需完成故事 · 用传说券' : '用一张传说券相遇'}</small></>}
      </Link>;
    })}</div></section>
  </div>;
}
