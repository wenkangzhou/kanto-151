'use client';
import {localeTag} from '@/lib/i18n/locale';
import { useT, useLocale } from '@/lib/i18n/locale';

import Link from 'next/link';
import { useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { companionNeighbors, swipeDirection, detailReturn, detailHref, teamNeighbors } from '@/domain/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen, Sparkles, Heart, ChartNoAxesColumnIncreasing, CalendarDays } from 'lucide-react';
import type { Pokemon } from '@/domain/types';
import { TYPE_NAMES } from '@/domain/types';
import { baseStatTotal, dexNumber, evolutionFamily, statLabels, strengthSummary } from '@/domain/pokemon';
import { collectionState, collectedIds, stateNames, unlockHint } from '@/domain/collection';
import { TypeDiscovery } from './type-discovery';
import { CollectionMark } from './collection-mark';
import { useCollection } from './collection-provider';
import { PartnerGreeting } from './partner-greeting';
import { PokemonArt } from './pokemon-art';
import { ReadAloud } from './read-aloud';
import { TypeBadge } from './type-badge';
import { SizeComparison } from './size-comparison';
import { useTeamView } from './team-memory';
import { centerPartners } from '@/domain/center';
export function PokemonDetail({ pokemon: p }: { pokemon: Pokemon }) {
  const localize = useT();
 const locale=useLocale();
  const { snapshot } = useCollection();
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get('from');
  const receipt = search.get('receipt');
  const back = detailReturn(from, receipt);
  const href = (id: number) => detailHref(id, from, receipt);
  const gesture = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const suppressClick = useRef(false);
  const teamView = useTeamView();
  const team = snapshot.team ?? [];
  const teamScope = team.includes(p.id) ? team : centerPartners(snapshot.records, team, teamView.filter, teamView.sort).map(record => record.pokemonId);
  const neighbors = from === 'team' ? teamNeighbors(p.id, teamScope) : companionNeighbors(p.id, snapshot.records.map(record => record.pokemonId));
  const state = collectionState(p, snapshot);
  const known = collectedIds(snapshot).has(p.id);
  const record = snapshot.records.find(r => r.pokemonId === p.id);
  const family = evolutionFamily(p);
  return <div className="page detail-page"><div className="detail-navigation"><Link href={back.href} className="back-link"><BookOpen size={25} /> {localize(back.label)}</Link><div>{neighbors.previous !== null && <Link scroll={false} replace href={href(neighbors.previous)} aria-label={localize("上一只宝可梦")}><ChevronLeft size={20} /></Link>}<span className="mono">{localize(dexNumber(p.id))}</span>{neighbors.next !== null && <Link scroll={false} replace href={href(neighbors.next)} aria-label={localize("下一只宝可梦")}><ChevronRight size={20} /></Link>}</div></div>
    <section className={`detail-hero detail-${known ? p.types[0] : 'locked'}`}><div className="detail-image detail-swipe" onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0) return;
      suppressClick.current = false;
      gesture.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
    }} onPointerUp={event => {
      const start = gesture.current; gesture.current = null;
      if (!start || start.pointer !== event.pointerId) return;
      const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y);
      if (!direction) return;
      suppressClick.current = true;
      const id = neighbors[direction];
      if (id !== null) router.replace(href(id), { scroll: false });
    }} onPointerCancel={() => { gesture.current = null; }} onClickCapture={event => {
      if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
    }}><span className="detail-big-number mono" aria-hidden>{localize(String(p.id).padStart(3, '0'))}</span><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} key={p.id}>{known ? <PartnerGreeting pokemon={p} /> : <PokemonArt pokemon={p} hidden priority />}</motion.div><span className="detail-image-caption mono">KANTO FIELD NOTES / {localize(String(p.id).padStart(3, '0'))}</span></div><div className="detail-intro"><span className="eyebrow">{localize(dexNumber(p.id))} · {localize(stateNames[state])}</span><h1>{localize(known ? p.name : '神秘的伙伴')}{known && <ReadAloud text={localize(p.name)} label={localize(`听听${p.name}的名字`)} />}</h1>{(locale==='zh'||!known)&&<div className="detail-english">{known?p.englishName:'A FRIEND YET TO MEET'}</div>}{known ? <><p className="traditional-name">{localize("繁体中文 ·")}{p.traditionalName}</p><div className="detail-types">{p.types.map(type => <TypeBadge type={type} key={type} />)}</div><p className="pokemon-description">{localize(p.description)}<ReadAloud text={localize(`${p.name}。${p.description}`)} /></p><SizeComparison pokemon={p} /></> : <div className="locked-description"><CollectionMark state={state} /><p>{localize(unlockHint(p, snapshot))}</p><span>{localize("相遇之后，名字和秘密就会出现在这里。")}</span></div>}</div></section>
    {known ? <><TypeDiscovery key={p.id} partner={p} discovered={collectedIds(snapshot)} />
    <section className="detail-panel evolution-panel"><div className="section-heading"><h2><Sparkles size={19} />{localize("成长的不同模样")}</h2>{family.length > 1 && <span className="muted">{localize("原来的伙伴，一直都在")}</span>}</div>{family.length === 1 ? <p className="strength-summary">{localize("在关都 151 图鉴中，它保持自己独一无二的模样。")}</p> : <><div className={`evolution-chain ${family.some(member => member.id === 133) ? 'eevee-chain' : ''}`}>{family.map((member, index) => {
      const discovered = collectedIds(snapshot).has(member.id);
      return <div className="evolution-step" key={member.id}>{index > 0 && <ArrowRight className="chain-arrow" size={18} />}<Link replace href={href(member.id)} className={p.id === member.id ? 'current-evolution' : ''}><PokemonArt pokemon={member} hidden={!discovered} /><span className="mono">{localize(dexNumber(member.id))}</span><strong>{localize(discovered ? member.name : '???')}</strong><small>{localize(member.evolvesFrom === 133 ? '从伊布选择这一分支' : stateNames[collectionState(member, snapshot)])}</small></Link></div>;
    })}</div><p className="panel-footnote">{localize("一张进化券，就能与一个新形态相遇。无需等级、石头或交换。伊布的三种进化可以分别选择收集。")}</p>{state === 'evolvable' && <Link href="/bag" className="text-link">{localize("去背包看看进化券")}<ArrowRight size={16} /></Link>}</>}</section>
    <details className="grownup-notes"><summary><ChartNoAxesColumnIncreasing size={22} />{localize("和家长一起看 · 种族值与小知识")}</summary><section className="detail-panel"><div className="section-heading"><h2><ChartNoAxesColumnIncreasing size={19} aria-hidden="true" />{localize("种族值")}</h2><span className="stat-total">{localize("合计")}<b>{localize(baseStatTotal(p))}</b></span></div><p className="strength-summary">{localize(strengthSummary(p))}</p><div className="stat-bars">{Object.entries(p.stats).map(([key, value]) => <div key={key} className="stat-row"><span>{localize(statLabels[key as keyof typeof statLabels])}</span><b className="mono">{localize(value)}</b><div role="meter" aria-label={localize(statLabels[key as keyof typeof statLabels])} aria-valuenow={value} aria-valuemin={0} aria-valuemax={255}><motion.span initial={{ width: 0 }} animate={{ width: `${value / 255 * 100}%` }} transition={{ duration: .5 }} /></div></div>)}</div><p className="panel-footnote">{localize("种族值帮助我们认识伙伴的特点，不是成长分数。")}</p></section>{p.types.join() !== p.kantoEraTypes.join() && <p className="type-era-note"><BookOpen size={15} />{localize("小知识：最初的关都冒险里，它的属性是")}{localize(p.kantoEraTypes.map(type => TYPE_NAMES[type]).join('、'))}{localize("。这里展示现在的属性。")}</p>}</details>
    <section className="acquisition-note"><div className="note-icon"><Heart size={23} /></div><div><span className="eyebrow">OUR LITTLE MEMORY</span><h2>{localize("我们的相遇，是因为……")}</h2><p>「{record?.reason || localize('一次值得珍藏的成长')}」</p><span className="memory-date"><CalendarDays size={14} />{localize(record ? new Date(record.acquiredAt).toLocaleDateString(localeTag(), { timeZone: 'Asia/Shanghai' }) : '')} · {localize(record?.method === 'evolution' ? '进化相遇' : '冒险相遇')}{localize(snapshot.source === 'demo' ? ' · 示例记录' : '')}</span></div></section><Link href={back.href} className="button detail-dex-return"><BookOpen size={29} />{localize(back.label)}<ArrowRight size={23} /></Link></> : <div className="mystery-note"><Sparkles size={20} /><h2>{localize("把惊喜，留给相遇的那一天")}</h2><p>{localize("继续认识新伙伴吧，这一页正在等你写下故事。")}</p><Link href={back.href} className="button secondary">{localize(back.label)} <ArrowRight size={16} /></Link></div>}
  </div>;
}
