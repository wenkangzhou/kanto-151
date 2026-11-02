'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Search, Sparkles } from 'lucide-react';
import { TYPE_NAMES, type Pokemon, type PokemonType } from '@/domain/types';
import { useLocale } from '@/lib/i18n/locale';
import styles from './johto-pokedex.module.css';

export type RegionalEntry = Pick<Pokemon, 'id' | 'name' | 'traditionalName' | 'englishName' | 'types' | 'description' | 'evolvesFrom' | 'height' | 'weight' | 'artwork'> & { regionalNumber: number };
type Region = 'johto' | 'hoenn';
type Origin = 'all' | 'new' | 'kanto' | 'johto' | 'branch';
const number = (id: number) => `#${String(id).padStart(3, '0')}`;
const types = Object.keys(TYPE_NAMES) as PokemonType[];
const regionConfig = {
  johto: { zh: '城都', en: 'Johto', code: 'JOHTO', total: 251, newStart: 152, newCount: 100, heroId: 152, volume: '002', otherRoute: '/hoenn/pokedex', otherZh: '丰缘预览', otherEn: 'Hoenn preview' },
  hoenn: { zh: '丰缘', en: 'Hoenn', code: 'HOENN', total: 202, newStart: 252, newCount: 135, heroId: 252, volume: '003', otherRoute: '/johto/pokedex', otherZh: '城都预览', otherEn: 'Johto preview' },
} as const;

export function RegionalPokedex({ region, entries, initialPokemonId }: { region: Region; entries: RegionalEntry[]; initialPokemonId?: number }) {
  const config = regionConfig[region];
  const locale = useLocale();
  const english = locale === 'en';
  const initialEntry = entries.find(pokemon => pokemon.id === initialPokemonId);
  const [query, setQuery] = useState(initialEntry?.name ?? '');
  const [type, setType] = useState<PokemonType | 'all'>('all');
  const [origin, setOrigin] = useState<Origin>('all');
  const [selectedId, setSelectedId] = useState(initialEntry?.id ?? config.heroId);
  const search = useDeferredValue(query.trim().toLowerCase());
  const kantoCount = entries.filter(pokemon => pokemon.id <= 151).length;
  const johtoCount = entries.filter(pokemon => pokemon.id >= 152 && pokemon.id <= 251).length;
  const results = useMemo(() => entries.filter(pokemon => {
    if (origin === 'new' && pokemon.id < config.newStart) return false;
    if (origin === 'kanto' && pokemon.id > 151) return false;
    if (origin === 'johto' && (pokemon.id < 152 || pokemon.id > 251)) return false;
    if (origin === 'branch' && (pokemon.id < config.newStart || pokemon.evolvesFrom === null || pokemon.evolvesFrom >= config.newStart)) return false;
    if (type !== 'all' && !pokemon.types.includes(type)) return false;
    return !search || number(pokemon.id).includes(search.replace(/^#/, '')) || number(pokemon.regionalNumber).includes(search.replace(/^#/, ''))
      || [pokemon.name, pokemon.traditionalName, pokemon.englishName].some(name => name.toLowerCase().includes(search));
  }), [entries, config.newStart, origin, type, search]);
  const selected = results.find(pokemon => pokemon.id === selectedId) ?? results[0];
  const typeName = (value: PokemonType) => english ? value[0].toUpperCase() + value.slice(1) : TYPE_NAMES[value];
  const originFilters: { key: Origin; zh: string; en: string }[] = [
    { key: 'all', zh: `全部 ${config.total} 位`, en: `All ${config.total}` },
    { key: 'new', zh: `新增 ${config.newCount} 位`, en: `New ${config.newCount}` },
    { key: 'kanto', zh: region === 'johto' ? '关都旧友' : `关都 ${kantoCount} 位`, en: `Kanto ${kantoCount}` },
    region === 'johto' ? { key: 'branch', zh: '进化支线', en: 'Evolutions' } : { key: 'johto', zh: `城都 ${johtoCount} 位`, en: `Johto ${johtoCount}` },
  ];
  const relatedId = selected && selected.id >= config.newStart ? selected.evolvesFrom : selected?.id;
  const relatedHref = relatedId && relatedId < config.newStart ? relatedId <= 151 ? `/pokemon/${relatedId}` : `/johto/pokedex?pokemon=${relatedId}` : null;
  const relatedText = selected && relatedId && relatedHref ? selected.id >= config.newStart
    ? english ? `See its earlier form ${number(relatedId)}` : `看看之前的形态 ${number(relatedId)}`
    : relatedId <= 151 ? english ? 'Open its Kanto record' : '翻开这位关都旧友的档案'
      : english ? 'Open its Johto record' : '去城都查看这位旧友' : '';

  return <div className={`${styles.page} ${region === 'hoenn' ? styles.hoenn : ''}`}>
    <header className={styles.header}>
      <Link href="/pokedex" className={styles.return}><ArrowLeft size={17} />{english ? 'Kanto Pokédex' : '返回关都图鉴'}</Link>
      <div className={styles.headerRight}><Link href={config.otherRoute}>{english ? config.otherEn : config.otherZh}<ArrowRight size={15} /></Link><span className={styles.preview}>{english ? 'INDEPENDENT PREVIEW' : '独立预览 · 暂未开放收集'}</span></div>
    </header>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.kicker}>{config.code} FIELD GUIDE / VOL. {config.volume}</span>
        <h1>{english ? `Discover ${config.en}` : `翻开${config.zh}图鉴`}<span>{config.total}</span></h1>
        <p>{region === 'johto'
          ? english ? 'The original Johto Pokédex brings 151 familiar Kanto Pokémon together with 100 new discoveries.' : '原始城都地区图鉴里，151 位关都旧友与第二世代新增的 100 位伙伴相遇了。'
          : english ? 'The original Hoenn Pokédex brings 135 new discoveries together with 67 familiar Pokémon from Kanto and Johto.' : '原始丰缘地区图鉴里，第三世代新增的 135 位伙伴，与来自关都和城都的 67 位旧友相遇了。'}</p>
        <div className={styles.heroMeta}><span><BookOpen size={17} />{english ? `Regional #001—${number(config.total)}` : `地区编号 #001—${number(config.total)}`}</span><span><Sparkles size={17} />{english ? `${config.newCount} new faces` : `${config.newCount} 位新伙伴`}</span></div>
      </div>
      <div className={styles.heroArt} aria-hidden="true"><span>{region === 'johto' ? 'J' : 'H'}</span><Image src={`/${region}/pokemon/${config.heroId}.png`} alt="" width={475} height={475} sizes="(max-width: 700px) 180px, 280px" priority /></div>
    </section>

    <section className={styles.bridge} aria-label={english ? `How ${config.en} relates to earlier regions` : `${config.zh}与已有地区的联系`}>
      <div><span className={styles.bridgeNumber}>01</span><strong>{english ? 'Two ways to number' : '两种编号，相同的伙伴'}</strong><p>{english ? `${config.en} has its own regional order; national numbers stay the same.` : `${config.zh}有自己的地区顺序，全国编号仍与其他地区共用。`}</p></div>
      <div><span className={styles.bridgeNumber}>02</span><strong>{region === 'johto' ? english ? 'Familiar beginnings' : '旧伙伴的新分支' : english ? 'Familiar faces return' : '关都与城都的旧友'}</strong><p>{region === 'johto' ? english ? '11 new Pokémon evolve directly from Kanto species.' : '11 位城都伙伴直接由关都宝可梦进化而来。' : english ? `${kantoCount} Kanto and ${johtoCount} Johto Pokémon also appear here, using their existing records.` : `${kantoCount} 位关都与 ${johtoCount} 位城都伙伴也在这里出现，资料直接沿用。`}</p></div>
      <div><span className={styles.bridgeNumber}>03</span><strong>{english ? 'Preview only' : '先认识，再相遇'}</strong><p>{english ? 'This preview does not change your collection, team or rewards.' : '这里先看图鉴，不影响已有收藏、小队和奖励。'}</p></div>
    </section>

    <section className={styles.catalog} aria-label={english ? `${config.en} Pokémon` : `${config.zh}宝可梦`}>
      <div className={styles.catalogHeading}><div><span className={styles.kicker}>THE ORIGINAL {config.total}</span><h2>{english ? `${config.en} Pokédex` : `${config.zh}宝可梦`}</h2></div><span>{results.length} / {config.total}</span></div>
      <div className={styles.tools}>
        <label className={styles.search}><Search size={18} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={english ? 'Search by name, regional or national number' : '搜索名字、地区或全国编号'} aria-label={english ? `Search ${config.en} Pokémon` : `搜索${config.zh}宝可梦`} /></label>
        <select value={type} onChange={event => setType(event.target.value as PokemonType | 'all')} aria-label={english ? 'Filter by type' : '按属性筛选'}><option value="all">{english ? 'All types' : '全部属性'}</option>{types.map(value => <option key={value} value={value}>{typeName(value)}</option>)}</select>
        <div className={styles.originFilter} role="group" aria-label={english ? 'Filter by origin' : '按来源筛选'}>{originFilters.map(filter => <button key={filter.key} type="button" aria-pressed={origin === filter.key} onClick={() => setOrigin(filter.key)}>{english ? filter.en : filter.zh}</button>)}</div>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {results.map(pokemon => <button className={styles.card} aria-pressed={selected?.id === pokemon.id} type="button" key={pokemon.id} onClick={() => setSelectedId(pokemon.id)}>
            <span className={styles.cardNumber}>{english ? config.code : config.zh} {number(pokemon.regionalNumber)}</span><Image src={pokemon.artwork} alt="" width={475} height={475} sizes="(max-width: 600px) 92px, 116px" /><strong>{english ? pokemon.englishName : pokemon.name}</strong><small>{english ? 'National' : '全国'} {number(pokemon.id)}</small>
          </button>)}
          {results.length === 0 && <p className={styles.empty}>{english ? 'No Pokémon match these filters.' : '没有找到符合条件的宝可梦，试试其他名字或属性。'}</p>}
        </div>
        {selected && <aside className={styles.detail} aria-live="polite">
          <div className={styles.detailImage}><span>{english ? config.code : config.zh} {number(selected.regionalNumber)}</span><Image key={selected.id} src={selected.artwork} alt={english ? selected.englishName : selected.name} width={475} height={475} sizes="(max-width: 700px) 220px, 260px" /></div>
          <span className={styles.detailKicker}>{config.code} {number(selected.regionalNumber)} / NATIONAL {number(selected.id)}</span>
          <h3>{english ? selected.englishName : selected.name}</h3><p className={styles.secondaryName}>{english ? selected.name : selected.englishName}</p>
          <div className={styles.typeList}>{selected.types.map(value => <span key={value}>{typeName(value)}</span>)}</div>
          <p className={styles.description}>{english ? `A Pokémon in the original ${config.en} regional Pokédex.` : selected.description}</p>
          <div className={styles.measure}><span>{english ? 'Height' : '身高'} <b>{selected.height} m</b></span><span>{english ? 'Weight' : '体重'} <b>{selected.weight} kg</b></span></div>
          {relatedHref && <Link href={relatedHref} className={styles.kantoLink}>{relatedText}<ArrowRight size={16} /></Link>}
        </aside>}
      </div>
    </section>
    <footer className={styles.footer}><span>{config.code} FIELD GUIDE · PREVIEW</span><Link href="/pokedex">{english ? 'Back to Kanto' : '回到关都'}<ArrowRight size={15} /></Link></footer>
  </div>;
}
