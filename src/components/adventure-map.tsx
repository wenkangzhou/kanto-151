'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Check, LockKeyhole, MapPin, Compass, ArrowRight } from 'lucide-react';
import { chapters, pokemonById } from '@/domain/pokemon';
import { collectedIds, currentChapter, collectionState } from '@/domain/collection';
import type { CollectionSnapshot } from '@/domain/types';
import { RegionPicture } from './region-picture';
import { PokemonArt } from './pokemon-art';
import { CollectionMark } from './collection-mark';
export function AdventureMap({ snapshot }: { snapshot: CollectionSnapshot }) {
  const current = currentChapter(snapshot)?.id ?? 7;
  const [chosen, setChosen] = useState<number | null>(null);
  const selected = chosen ?? current;
  const chapter = chapters.find(item => item.id === selected);
  const ids = collectedIds(snapshot);
  return <section className="detail-panel adventure-map"><div className="section-heading"><h2><Compass size={24} /> 跟着动画去冒险</h2><button className="text-link" onClick={() => setChosen(null)}><MapPin size={18} /> 回到这一站</button></div>
    <div className="map-stations" role="group" aria-label="选择想看的区域">{[...chapters.map(chapter => ({ id: chapter.id, name: chapter.location.split(' · ')[0] })), { id: 7, name: '自由探索' }].map(region => <button key={region.id} aria-pressed={selected === region.id} aria-label={`${region.name}，${region.id < current ? '已完成' : region.id === current ? '正在探索' : '尚未开放'}`} className={`map-station ${selected === region.id ? 'selected' : ''} ${region.id > current ? 'waiting' : ''}`} onClick={() => setChosen(region.id)}><RegionPicture chapterId={region.id} /><strong>{region.name}</strong><span className="station-status">{region.id < current ? <Check size={17} /> : region.id === current ? <MapPin size={18} /> : <LockKeyhole size={16} />}{region.id < current ? '走过啦' : region.id === current ? '你在这里' : '还没到'}</span></button>)}</div>
    <div className="map-preview" aria-live="polite"><div className="map-preview-heading"><h3>{chapter?.name ?? '继续认识更多伙伴'}</h3><span>{chapter ? `${chapter.pokemonIds.filter(id => ids.has(id)).length} / ${chapter.pokemonIds.length}` : '故事完成后开启'}</span></div>{chapter ? <><div className="chapter-friends">{chapter.pokemonIds.map(id => { const partner = pokemonById.get(id)!; const known = ids.has(id); return <Link key={id} href={`/pokemon/${id}`} aria-label={known ? partner.name : `编号 ${String(id).padStart(3, '0')}，未发现的伙伴`}><PokemonArt pokemon={partner} hidden={!known} /><CollectionMark state={collectionState(partner, snapshot)} /><span>{known ? partner.name : '???'}</span></Link>; })}</div><p>{selected < current ? '这一站的伙伴，都在图鉴里啦。' : selected === current ? '按动画顺序认识这一站的伙伴，就能走向下一站。' : '先完成现在这一站，再来这里找伙伴。'}</p></> : <div className="free-exploration-note"><RegionPicture chapterId={7} /><p>六站故事之后，去发现关都各处的新伙伴。</p>{current === 7 && <Link className="button" href="/capture">去打开奖励 <ArrowRight size={19} /></Link>}</div>}</div>
  </section>;
}
