'use client';
import Link from 'next/link';
import { ArrowRight, Ticket, Sparkles, Mountain, LockKeyhole } from 'lucide-react';
import { useCollection } from './collection-provider';
import { evolutionOptions, legendaryEligible } from '@/domain/collection';
import { pokemonById } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';
export function Bag() {
  const { snapshot } = useCollection();
  const options = evolutionOptions(snapshot);
  const parents = [...new Set(options.map(p => p.evolvesFrom!))];
  return <div className="page bag-page"><div className="page-heading"><div><div className="eyebrow"><span /> GOOD THINGS IN YOUR POCKET</div><h1>装着惊喜的小背包<span className="title-dot">.</span></h1><p>每一张券，都来自一次了不起的努力。</p></div></div>
    <div className="ticket-grid"><section className="inventory-ticket evolution-ticket"><Ticket size={35} /><span className="eyebrow">A CHANCE TO GROW</span><h2>进化券 <strong>{snapshot.inventory.evolution}<small> 张</small></strong></h2><p>让一位伙伴长成新的模样。<br />原来的它，会继续留在图鉴里。</p><span className="ticket-status">{snapshot.source === 'demo' ? '示例库存 · 暂不可使用' : '等待家长奖励'}</span></section><section className="inventory-ticket legendary-ticket"><Sparkles size={35} /><span className="eyebrow">SOMETHING EXTRAORDINARY</span><h2>传说券 <strong>{snapshot.inventory.legendary}<small> 张</small></strong></h2><p>当图鉴积累足够多的伙伴，<br />开启一次特别的传说相遇。</p><span className="ticket-status">{snapshot.source === 'demo' ? '示例库存 · 暂不可使用' : '等待家长奖励'}</span></section></div>
    <section className="detail-panel"><div className="section-heading"><h2><Sparkles size={19} /> 可以迎接进化的伙伴</h2><span className="muted">{parents.length} 位伙伴</span></div>{parents.length ? <div className="evolution-eligible">{parents.map(id => { const p = pokemonById.get(id)!; return <Link href={`/pokemon/${id}`} key={id}><PokemonArt pokemon={p} /><div><strong>{p.name}</strong><small>{options.filter(option => option.evolvesFrom === id).length} 个未收集的新形态</small></div><ArrowRight size={17} /></Link>; })}</div> : <p className="strength-summary">先与新伙伴相遇吧。可以进化的伙伴会出现在这里。</p>}<p className="panel-footnote">第一版可以查看进化关系。真实兑换与进化会在奖励功能开放后启用。</p></section>
    <section className="detail-panel"><div className="section-heading"><h2><Mountain size={19} /> 远方的传说</h2></div><div className="legendary-list">{[144, 145, 146, 150, 151].map((id, index) => <Link href={`/pokemon/${id}`} key={id}><LockKeyhole size={17} /><span className="mono">#{id}</span><div><strong>{id === 151 ? '最后的奇迹' : `传说相遇 ${String(index + 1).padStart(2, '0')}`}</strong><small>{id === 151 ? '收集 150 只 · 自动开启 · 无需传说券' : `收集 ${[60, 80, 100, 140][index]} 只${id === 150 ? ' · 完成故事' : ''} · 使用传说券`}</small></div><span className={`legendary-status ${legendaryEligible(id, snapshot) ? 'ready' : ''}`}>{legendaryEligible(id, snapshot) ? '已达条件' : '未解锁'}</span></Link>)}</div></section>
  </div>;
}
