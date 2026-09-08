'use client';
import Link from 'next/link';
import { ArrowRight, Footprints, Heart, Sparkles } from 'lucide-react';
import { useCollection } from './collection-provider';
import { pokemonById, dexNumber } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';
export function History() {
  const { snapshot, demo } = useCollection();
  const records = [...snapshot.records].sort((a, b) => b.acquiredAt.localeCompare(a.acquiredAt));
  const days = [...new Set(records.map(record => record.acquiredAt.slice(0, 10)))];
  return <div className="page history-page"><div className="page-heading"><div><div className="eyebrow"><span /> THE STORIES WE KEEP</div><h1>每一步，都算数<span className="title-dot">.</span></h1><p>宝可梦会记得，那天你很棒的样子。</p></div><span className="region-stamp mono">成长足迹<small>{records.length} LITTLE MEMORIES</small></span></div>
    <div className="memory-banner"><Heart size={25} /><div><h2>{records.length} 件值得珍藏的小事</h2><p>{demo ? '这是示例成长手帐，未来这里会记录属于你们的真实故事。' : '这里会记录每一位伙伴，以及那次值得奖励的努力。'}</p></div></div>
    {days.length ? <div className="timeline">{days.map(day => <section key={day} className="timeline-day"><h2><span />{new Date(`${day}T12:00:00+08:00`).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' })}<small className="mono">{day.slice(0, 4)}</small></h2><div className="timeline-records">{records.filter(r => r.acquiredAt.startsWith(day)).reverse().map(record => {
      const p = pokemonById.get(record.pokemonId)!;
      return <Link key={record.pokemonId} href={`/pokemon/${p.id}`} className="memory-card"><div className={`memory-art card-${p.types[0]}`}><PokemonArt pokemon={p} /></div><div className="memory-content"><span className="memory-method">{record.method === 'evolution' ? <Sparkles size={12} /> : <Footprints size={12} />}{record.method === 'evolution' ? '新的成长模样' : '认识了一位新伙伴'}</span><h3>{p.name}<small>{dexNumber(p.id)}</small></h3><p>{record.reason}</p></div><ArrowRight size={18} /></Link>;
    })}</div></section>)}</div> : <div className="empty-state"><Footprints size={32} /><h2>手帐的第一页，留给你</h2><p>每一次真实的努力，都会成为一段特别的相遇。</p><Link href="/pokedex" className="button secondary">先去认识图鉴</Link></div>}
    <div className="end-note"><Heart size={16} />成长没有排行榜，只有属于你的故事。</div>
  </div>;
}
