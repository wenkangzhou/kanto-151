'use client';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles, BookOpen, Ticket, Footprints, ChevronRight, Flag } from 'lucide-react';
import { useCollection } from './collection-provider';
import { chapters, pokemonById } from '@/domain/pokemon';
import { collectedIds, currentChapter } from '@/domain/collection';
import { PokemonArt } from './pokemon-art';
import { CollectionMark } from './collection-mark';
import { PokemonCard } from './pokemon-card';
export function Adventure() {
  const { snapshot, demo, pendingReceipt } = useCollection();
  const ids = collectedIds(snapshot);
  const chapter = currentChapter(snapshot);
  const recent = [...snapshot.records].reverse().slice(0, 4);
  const chapterCount = chapter?.pokemonIds.filter(id => ids.has(id)).length ?? 0;
  return <div className="page adventure-page"><div className="page-heading"><div><div className="eyebrow"><span /> A LITTLE BRAVER, EVERY DAY</div><h1>出发吧，小小冒险家<span className="title-dot">.</span></h1><p>真实世界的每一次成长，都值得一场新的相遇。</p></div><span className="region-stamp mono">冒险手帐<small>CHAPTER {String(chapter?.id ?? 7).padStart(2, '0')}</small></span></div>
    <nav className="child-home-actions" aria-label="开始冒险"><Link href="/capture" className="child-home-action reward-home-action"><span className="home-action-picture" aria-hidden="true"><span className="action-picture-orbit" /><CollectionMark state="available" /><Sparkles className="action-picture-sparkle" size={28} /></span><span className="home-action-copy"><strong>打开奖励</strong><span>点数字，遇见新伙伴</span></span><ArrowRight size={28} aria-hidden="true" /></Link><Link href="/pokedex" className="child-home-action dex-home-action"><span className="home-action-picture" aria-hidden="true"><span className="action-picture-orbit" /><span className="picture-pokedex"><BookOpen size={67} strokeWidth={1.7} /><span className="pokedex-light" /><span className="pokedex-mini-ball"><CollectionMark state="available" /></span></span></span><span className="home-action-copy"><strong>看看伙伴</strong><span>翻开我的宝可梦图鉴</span></span><ArrowRight size={28} aria-hidden="true" /></Link></nav>
    <section className="adventure-hero"><div className="hero-content"><span className="hero-tag"><MapPin size={14} />{chapter?.location ?? '关都地区 · 自由探索'}</span><h2>{chapter?.name ?? '世界很大，继续探索'}</h2><p>{chapter?.description ?? '故事已经写完，新的相遇还在路上。'}</p><span className="hero-footnote">每一次努力，都让冒险向前一步。</span></div><div className="hero-art" aria-hidden><span className="hero-orbit" /><span className="hero-art-number mono">151</span><PokemonArt pokemon={pokemonById.get(1)!} priority /><Sparkles className="hero-sparkles" size={34} /></div></section>
    {pendingReceipt && <Link href={`/capture?receipt=${pendingReceipt.id}`} className="pending-receipt"><Sparkles size={22} /><span>打开已经保存的相遇</span><ArrowRight size={18} /></Link>}
    <div className="home-stats"><Link href="/pokedex"><BookOpen size={24} /><div><strong>{ids.size}<span> / 151</span></strong><small>已相遇的伙伴</small></div><ChevronRight size={18} /></Link><Link href="/bag"><Ticket size={24} /><div><strong>{snapshot.inventory.evolution}<span> 张</span></strong><small>背包里的进化券</small></div><ChevronRight size={18} /></Link><Link href="/history"><Footprints size={24} /><div><strong>{snapshot.records.length}<span> 个</span></strong><small>值得纪念的成长</small></div><ChevronRight size={18} /></Link></div>
    <section className="chapter-panel"><div className="section-heading"><div><span className="eyebrow">THE NEXT LITTLE STEP</span><h2>这一站的冒险</h2></div><span className="muted">{chapter ? `${chapterCount} / ${chapter.pokemonIds.length} 位伙伴已相遇` : '故事章节已完成'}</span></div><div className="chapter-route">{chapters.map(c => <div key={c.id} className={`chapter-stop ${chapter && c.id === chapter.id ? 'current' : !chapter || c.id < chapter.id ? 'done' : ''}`}><span>{!chapter || c.id < chapter.id ? <Flag size={16} /> : String(c.id).padStart(2, '0')}</span><div>{c.location.split(' · ')[0]}<small>{!chapter || c.id < chapter.id ? '已探索' : c.id === chapter.id ? '正在探索' : '等待出发'}</small></div></div>)}</div><p className="chapter-tip">收集这一站的所有捕捉伙伴，就能走向下一站。进化可以慢慢来。</p></section>
    <section><div className="section-heading"><div><span className="eyebrow">NICE TO MEET YOU</span><h2>最近认识的伙伴</h2></div><Link href="/pokedex" className="text-link">翻开图鉴 <ArrowRight size={16} /></Link></div>{recent.length ? <div className="pokemon-grid recent-grid">{recent.map(record => <PokemonCard key={record.pokemonId} pokemon={pokemonById.get(record.pokemonId)!} />)}</div> : <div className="empty-state compact"><Sparkles size={28} /><h3>第一位伙伴，还在等你</h3><p>先翻翻图鉴，看看神秘的剪影吧。</p><Link href="/pokedex" className="text-link">打开图鉴 <ArrowRight size={16} /></Link></div>}</section>
    {demo && <p className="demo-note">你正在体验一份示例冒险。右上角可切换「全新图鉴」，看看冒险刚开始的样子。</p>}
  </div>;
}
