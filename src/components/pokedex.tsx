'use client';
import { useDeferredValue, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, X, BookOpen, Check, LockKeyhole } from 'lucide-react';
import { pokemon } from '@/domain/pokemon';
import { collectedIds, collectionState } from '@/domain/collection';
import { TYPE_NAMES, type PokemonType } from '@/domain/types';
import { useCollection } from './collection-provider';
import { PokemonCard } from './pokemon-card';
const filters = [{ id: 'all', label: '全部图鉴' }, { id: 'collected', label: '已收集' }, { id: 'evolvable', label: '可进化' }, { id: 'locked', label: '未发现' }] as const;
export function Pokedex() {
  const { snapshot, demo } = useCollection();
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim().toLowerCase());
  const [filter, setFilter] = useState<string>('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('number');
  const ids = useMemo(() => collectedIds(snapshot), [snapshot]);
  const results = useMemo(() => pokemon.filter(p => {
    const state = collectionState(p, snapshot);
    const known = ids.has(p.id);
    const matchesQuery = !search || String(p.id).padStart(3, '0').includes(search.replace(/^#/, '')) || (known && [p.name, p.traditionalName, p.englishName].some(name => name.toLowerCase().includes(search)));
    const matchesState = filter === 'all' || (filter === 'collected' ? known : filter === 'locked' ? !known : state === 'evolvable');
    return matchesQuery && matchesState && (type === 'all' || (known && p.types.includes(type as PokemonType)));
  }).sort((a, b) => sort === 'recent' ? (snapshot.records.find(r => r.pokemonId === b.id)?.acquiredAt ?? '').localeCompare(snapshot.records.find(r => r.pokemonId === a.id)?.acquiredAt ?? '') || a.id - b.id : a.id - b.id), [snapshot, search, filter, type, sort, ids]);
  const progress = Math.round(ids.size / 151 * 100);
  const reset = () => { setQuery(''); setFilter('all'); setType('all'); setSort('number'); };
  return <div className="page pokedex-page">
    <div className="page-heading"><div><div className="eyebrow"><span /> THE KANTO COLLECTION</div><h1>我的宝可梦图鉴<span className="title-dot">.</span></h1><p>151 次相遇，把成长的故事慢慢装满。</p></div><span className="region-stamp mono">关都地区<small>VOL. 001 — 151</small></span></div>
    <section className="collection-banner" aria-label="收藏进度"><div className="banner-emblem"><BookOpen size={28} strokeWidth={1.5} /></div><div className="banner-copy"><span>冒险，正在一点点变精彩</span><h2><strong>{ids.size}</strong><span> / 151 位伙伴</span></h2></div><div className="banner-progress"><div><span>图鉴完成度</span><b className="mono">{progress}%</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><p>{demo ? '正在浏览示例收藏，真实的冒险由你来书写。' : '空白的一页，也是一段了不起的开始。'}</p></div><div className="banner-number mono" aria-hidden>151</div></section>
    <section className="pokedex-tools" aria-label="图鉴筛选"><div className="filter-tabs">{filters.map(item => <button key={item.id} onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={filter === item.id ? 'selected' : ''}>{item.id === 'evolvable' && <Sparkles size={15} />}{item.label}{item.id === 'collected' && <span>{ids.size}</span>}</button>)}</div><div className="search-row"><label className="search-box"><Search size={19} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="寻找已发现的伙伴，或输入编号…" aria-label="搜索已发现的宝可梦名称或编号" />{query && <button onClick={() => setQuery('')} aria-label="清空搜索"><X size={17} /></button>}</label><label className="select-wrap"><SlidersHorizontal size={16} /><select aria-label="按属性筛选已发现的宝可梦" value={type} onChange={event => setType(event.target.value)}><option value="all">全部属性</option>{Object.entries(TYPE_NAMES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><select className="sort-select" aria-label="排序方式" value={sort} onChange={event => setSort(event.target.value)}><option value="number">按图鉴编号</option><option value="recent">按相遇时间</option></select></div></section>
    <div className="results-meta"><span aria-live="polite">{results.length} 位伙伴{type !== 'all' && ' · 仅显示已发现的属性'}</span><div className="legend"><span><Check size={13} /> 已收集</span><span><Sparkles size={13} /> 可进化</span><span><LockKeyhole size={12} /> 未发现</span></div></div>
    {results.length ? <div className="pokemon-grid">{results.map((p, index) => <PokemonCard key={p.id} pokemon={p} priority={index < 6} />)}</div> : <div className="empty-state"><Search size={30} /><h2>还没有找到这位伙伴</h2><p>试试图鉴编号，或换一个筛选条件。<br />未发现的宝可梦会暂时藏起名字。</p><button className="button secondary" onClick={reset}>查看全部图鉴</button></div>}
    <div className="end-note"><Sparkles size={17} /><span>不用着急，每一次努力都会让我们更近一点。</span></div>
  </div>;
}
