'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, BookOpen, Sparkles, Heart, ChartNoAxesColumnIncreasing, Ruler, Weight, CalendarDays } from 'lucide-react';
import type { Pokemon } from '@/domain/types';
import { TYPE_NAMES } from '@/domain/types';
import { baseStatTotal, dexNumber, evolutionFamily, statLabels, strengthSummary } from '@/domain/pokemon';
import { collectionState, collectedIds, stateNames, unlockHint } from '@/domain/collection';
import { TypeDiscovery } from './type-discovery';
import { CollectionMark } from './collection-mark';
import { useCollection } from './collection-provider';
import { PokemonArt } from './pokemon-art';
import { TypeBadge } from './type-badge';
export function PokemonDetail({ pokemon: p }: { pokemon: Pokemon }) {
  const { snapshot } = useCollection();
  const state = collectionState(p, snapshot);
  const known = collectedIds(snapshot).has(p.id);
  const record = snapshot.records.find(r => r.pokemonId === p.id);
  const family = evolutionFamily(p);
  return <div className="page detail-page"><div className="detail-navigation"><Link href="/pokedex" className="back-link"><ArrowLeft size={17} /> 返回图鉴</Link><div>{p.id > 1 && <Link href={`/pokemon/${p.id - 1}`} aria-label="上一只宝可梦"><ChevronLeft size={20} /></Link>}<span className="mono">{dexNumber(p.id)}</span>{p.id < 151 && <Link href={`/pokemon/${p.id + 1}`} aria-label="下一只宝可梦"><ChevronRight size={20} /></Link>}</div></div>
    <section className={`detail-hero detail-${known ? p.types[0] : 'locked'}`}><div className="detail-image"><span className="detail-big-number mono" aria-hidden>{String(p.id).padStart(3, '0')}</span><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} key={p.id}><PokemonArt pokemon={p} hidden={!known} priority /></motion.div><span className="detail-image-caption mono">KANTO FIELD NOTES / {String(p.id).padStart(3, '0')}</span></div><div className="detail-intro"><span className="eyebrow">{dexNumber(p.id)} · {stateNames[state]}</span><h1>{known ? p.name : '神秘的伙伴'}</h1><div className="detail-english">{known ? p.englishName : 'A FRIEND YET TO MEET'}</div>{known ? <><p className="traditional-name">繁体中文 · {p.traditionalName}</p><div className="detail-types">{p.types.map(type => <TypeBadge type={type} key={type} />)}</div><p className="pokemon-description">{p.description}</p><div className="size-stats"><span><Ruler size={17} /><small>身高</small><b>{p.height} m</b></span><span><Weight size={17} /><small>体重</small><b>{p.weight} kg</b></span></div></> : <div className="locked-description"><CollectionMark state={state} /><p>{unlockHint(p, snapshot)}</p><span>相遇之后，名字和秘密就会出现在这里。</span></div>}</div></section>
    {known ? <><TypeDiscovery key={p.id} partner={p} discovered={collectedIds(snapshot)} />
    <section className="detail-panel evolution-panel"><div className="section-heading"><h2><Sparkles size={19} /> 成长的不同模样</h2>{family.length > 1 && <span className="muted">原来的伙伴，一直都在</span>}</div>{family.length === 1 ? <p className="strength-summary">在关都 151 图鉴中，它保持自己独一无二的模样。</p> : <><div className={`evolution-chain ${family.some(member => member.id === 133) ? 'eevee-chain' : ''}`}>{family.map((member, index) => {
      const discovered = collectedIds(snapshot).has(member.id);
      return <div className="evolution-step" key={member.id}>{index > 0 && <ArrowRight className="chain-arrow" size={18} />}<Link href={`/pokemon/${member.id}`} className={p.id === member.id ? 'current-evolution' : ''}><PokemonArt pokemon={member} hidden={!discovered} /><span className="mono">{dexNumber(member.id)}</span><strong>{discovered ? member.name : '???'}</strong><small>{member.evolvesFrom === 133 ? '从伊布选择这一分支' : stateNames[collectionState(member, snapshot)]}</small></Link></div>;
    })}</div><p className="panel-footnote">一张进化券，就能与一个新形态相遇。无需等级、石头或交换。伊布的三种进化可以分别选择收集。</p>{state === 'evolvable' && <Link href="/bag" className="text-link">去背包看看进化券 <ArrowRight size={16} /></Link>}</>}</section>
    <details className="grownup-notes"><summary><ChartNoAxesColumnIncreasing size={22} /> 和家长一起看 · 种族值与小知识</summary><section className="detail-panel"><div className="section-heading"><h2><ChartNoAxesColumnIncreasing size={19} aria-hidden="true" /> 种族值</h2><span className="stat-total">合计 <b>{baseStatTotal(p)}</b></span></div><p className="strength-summary">{strengthSummary(p)}</p><div className="stat-bars">{Object.entries(p.stats).map(([key, value]) => <div key={key} className="stat-row"><span>{statLabels[key as keyof typeof statLabels]}</span><b className="mono">{value}</b><div role="meter" aria-label={statLabels[key as keyof typeof statLabels]} aria-valuenow={value} aria-valuemin={0} aria-valuemax={255}><motion.span initial={{ width: 0 }} animate={{ width: `${value / 255 * 100}%` }} transition={{ duration: .5 }} /></div></div>)}</div><p className="panel-footnote">种族值帮助我们认识伙伴的特点，不是成长分数。</p></section>{p.types.join() !== p.kantoEraTypes.join() && <p className="type-era-note"><BookOpen size={15} /> 小知识：最初的关都冒险里，它的属性是{p.kantoEraTypes.map(type => TYPE_NAMES[type]).join('、')}。这里展示现在的属性。</p>}</details>
    <section className="acquisition-note"><div className="note-icon"><Heart size={23} /></div><div><span className="eyebrow">OUR LITTLE MEMORY</span><h2>我们的相遇，是因为……</h2><p>「{record?.reason || '一次值得珍藏的成长'}」</p><span className="memory-date"><CalendarDays size={14} />{record ? new Date(record.acquiredAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) : ''} · {record?.method === 'evolution' ? '进化相遇' : '冒险相遇'}{snapshot.source === 'demo' ? ' · 示例记录' : ''}</span></div></section></> : <div className="mystery-note"><Sparkles size={20} /><h2>把惊喜，留给相遇的那一天</h2><p>继续认识新伙伴吧，这一页正在等你写下故事。</p><Link href="/pokedex" className="button secondary">继续翻图鉴 <ArrowRight size={16} /></Link></div>}
  </div>;
}
