'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight, MapPinned, Sparkles } from 'lucide-react';
import { TYPE_NAMES, type PokemonType } from '@/domain/types';
import { swipeDirection } from '@/domain/navigation';
import type { RegionalDetailRelations } from '@/domain/regional-relations';
import { useLocale, useT } from '@/lib/i18n/locale';
import { PartnerGreeting } from './partner-greeting';
import { PokemonArt } from './pokemon-art';
import { ReadAloud } from './read-aloud';
import { SizeComparison } from './size-comparison';
import { TypeBadge } from './type-badge';
import { TypeDiscovery } from './type-discovery';
import { SystemVoiceProvider } from './voice-mode';
import type { RegionalEntry } from './regional-pokedex';
import styles from './regional-pokemon-detail.module.css';

type Region = 'johto' | 'hoenn';
const number = (id: number) => `#${String(id).padStart(3, '0')}`;
const regionNames = {
  kanto: { zh: '关都', en: 'Kanto' },
  johto: { zh: '城都', en: 'Johto' },
  hoenn: { zh: '丰缘', en: 'Hoenn' },
} as const;
const englishStatNames: Record<string, string> = {
  hp: 'HP', attack: 'Attack', defense: 'Defense',
  'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', speed: 'Speed',
};
const chineseStatNames: Record<string, string> = {
  hp: '体力', attack: '攻击', defense: '防御',
  'special-attack': '特攻', 'special-defense': '特防', speed: '速度',
};

export function RegionalPokemonDetail({ region, pokemon: p, previous, next, relations }: {
  region: Region;
  pokemon: RegionalEntry;
  previous?: RegionalEntry;
  next?: RegionalEntry;
  relations: RegionalDetailRelations;
}) {
  const locale = useLocale();
  const localize = useT();
  const english = locale === 'en';
  const language = english ? 'en' : 'zh';
  const regionName = regionNames[region][language];
  const title = english ? p.englishName : p.name;
  const description = english ? p.englishDescription ?? localize(p.description) : p.description;
  const displayPokemon = { ...p, name: title };
  const listHref = `/${region}/pokedex#pokemon-${p.id}`;
  const href = (id: number) => `/${region}/pokedex/${id}`;
  const gesture = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const suppressClick = useRef(false);
  const router = useRouter();
  const stats = Object.entries(p.stats) as [keyof typeof p.stats, number][];
  const total = stats.reduce((sum, [, value]) => sum + value, 0);
  const strongest = Math.max(...stats.map(([, value]) => value));
  const strongestNames = stats.filter(([, value]) => value === strongest).map(([key]) => english ? englishStatNames[key] : chineseStatNames[key]);
  const strength = english
    ? `Among its six base stats, ${strongestNames.join(' and ')} is highest (${strongest}).`
    : `六项种族值中，${strongestNames.join('、')}最高（${strongest}）。`;
  const eraTypes = p.kantoEraTypes;
  const family = relations.family;

  return <SystemVoiceProvider><div className={`page detail-page ${styles.page} ${region === 'hoenn' ? styles.hoenn : ''}`}>
    <div className="detail-navigation">
      <Link href={listHref} className="back-link"><BookOpen size={25} />{english ? `Back to ${regionName} Pokédex` : `返回${regionName}图鉴`}</Link>
      <div>
        {previous && <Link scroll={false} replace href={href(previous.id)} aria-label={english ? 'Previous Pokémon' : '上一只宝可梦'}><ChevronLeft size={20} /></Link>}
        <span className="mono">{number(p.regionalNumber)}</span>
        {next && <Link scroll={false} replace href={href(next.id)} aria-label={english ? 'Next Pokémon' : '下一只宝可梦'}><ChevronRight size={20} /></Link>}
      </div>
    </div>
    <p className={styles.previewLabel}>{english ? `${regionName} field guide · independent preview` : `${regionName}地区图鉴 · 独立预览，暂未开放收集`}</p>

    <section className={`detail-hero detail-${p.types[0]}`} aria-labelledby="regional-pokemon-title">
      <div className="detail-image detail-swipe" onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        suppressClick.current = false;
        gesture.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
      }} onPointerUp={event => {
        const start = gesture.current; gesture.current = null;
        if (!start || start.pointer !== event.pointerId) return;
        const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y);
        if (!direction) return;
        suppressClick.current = true;
        const neighbor = direction === 'previous' ? previous : next;
        if (neighbor) router.replace(href(neighbor.id), { scroll: false });
      }} onPointerCancel={() => { gesture.current = null; }} onClickCapture={event => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
      }}>
        <span className="detail-big-number mono" aria-hidden>{String(p.regionalNumber).padStart(3, '0')}</span>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} key={p.id}><PartnerGreeting pokemon={displayPokemon} /></motion.div>
        <span className="detail-image-caption mono">{region.toUpperCase()} FIELD NOTES / {String(p.regionalNumber).padStart(3, '0')}</span>
      </div>
      <div className="detail-intro">
        <span className="eyebrow">{region.toUpperCase()} {number(p.regionalNumber)} · NATIONAL {number(p.id)}</span>
        <h1 id="regional-pokemon-title">{title}<ReadAloud text={title} label={english ? `Hear ${title}'s name` : `听听${title}的名字`} /></h1>
        {!english && <div className="detail-english">{p.englishName}</div>}
        <p className="traditional-name">{english ? 'Traditional Chinese · ' : '繁体中文 · '}{p.traditionalName}</p>
        <div className="detail-types">{p.types.map(type => <TypeBadge type={type} key={type} />)}</div>
        <p className="pokemon-description">{description}<ReadAloud text={`${title}。${description}`} /></p>
        <SizeComparison pokemon={displayPokemon} />
      </div>
    </section>

    <TypeDiscovery key={p.id} partner={displayPokemon} examplePool={relations.examplePool} />

    <section className="detail-panel evolution-panel">
      <div className="section-heading"><h2><Sparkles size={19} />{localize('成长的不同模样')}</h2>{family.length > 1 && <span className="muted">{localize('原来的伙伴，一直都在')}</span>}</div>
      {family.length === 1 ? <p className="strength-summary">{english ? `In the ${regionName} Pokédex, this Pokémon keeps its own unique form.` : `在${regionName}图鉴中，它保持自己独一无二的模样。`}</p>
        : <div className={`evolution-chain ${family.length > 4 ? styles.branchingFamily : ''}`}>{family.map((member, index) => member.href && <div className="evolution-step" key={member.id}>
          {index > 0 && <ArrowRight className="chain-arrow" size={18} />}
          <Link href={member.href} className={p.id === member.id ? 'current-evolution' : ''}>
            <PokemonArt pokemon={member} /><span className="mono">{number(member.id)}</span>
            <strong>{english ? member.englishName : member.name}</strong>
            <small>{p.id === member.id ? english ? 'Current Pokémon' : '当前伙伴' : english ? 'Related form' : '成长形态'}</small>
          </Link>
        </div>)}</div>}
      <p className="panel-footnote">{english ? 'Evolution links connect the same species across regions. This preview does not change your collection.' : '进化关系跨地区相连；这里仅供认识伙伴，不改变已有收藏。'}</p>
    </section>

    <details className="grownup-notes">
      <summary><ChartNoAxesColumnIncreasing size={22} />{localize('和家长一起看 · 种族值与小知识')}</summary>
      <section className="detail-panel">
        <div className="section-heading"><h2><ChartNoAxesColumnIncreasing size={19} aria-hidden="true" />{localize('种族值')}</h2><span className="stat-total">{localize('合计')}<b>{total}</b></span></div>
        <p className="strength-summary">{strength}</p>
        <div className="stat-bars">{stats.map(([key, value]) => <div key={key} className="stat-row">
          <span>{english ? englishStatNames[key] : chineseStatNames[key]}</span><b className="mono">{value}</b>
          <div role="meter" aria-label={english ? englishStatNames[key] : chineseStatNames[key]} aria-valuenow={value} aria-valuemin={0} aria-valuemax={255}><motion.span initial={{ width: 0 }} animate={{ width: `${value / 255 * 100}%` }} transition={{ duration: .5 }} /></div>
        </div>)}</div>
        <p className="panel-footnote">{localize('种族值帮助我们认识伙伴的特点，不是成长分数。')}</p>
      </section>
      {eraTypes && eraTypes.join() !== p.types.join() && <p className="type-era-note"><BookOpen size={15} />{localize('小知识：最初的关都冒险里，它的属性是')}{eraTypes.map(type => english ? type : TYPE_NAMES[type as PokemonType]).join(english ? ', ' : '、')}{localize('。这里展示现在的属性。')}</p>}
    </details>

    <section className={`acquisition-note ${styles.regionalNote}`}>
      <div className="note-icon"><MapPinned size={23} /></div>
      <div><span className="eyebrow">REGIONAL FIELD NOTES</span><h2>{english ? 'The same friend across regions' : '同一位伙伴，不同地区的足迹'}</h2>
        <p>{english ? 'Its national number stays the same. Each regional Pokédex gives it a local place.' : '全国编号始终相同，地区图鉴各有自己的顺序。'}</p>
        <div className={styles.regionLinks}>{relations.appearances.map(appearance => {
          const label = regionNames[appearance.region][language];
          return appearance.region === region
            ? <span key={appearance.region} aria-current="page">{label} {number(appearance.number)}</span>
            : <Link key={appearance.region} href={appearance.href} prefetch={false}>{label} {number(appearance.number)}<ArrowRight size={14} /></Link>;
        })}</div>
      </div>
    </section>
    <Link href={listHref} className="button detail-dex-return"><BookOpen size={29} />{english ? `Back to ${regionName} Pokédex` : `返回${regionName}图鉴`}<ArrowRight size={23} /></Link>
  </div></SystemVoiceProvider>;
}
