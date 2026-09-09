import { ArrowRight, Check, Flag, Sparkles } from 'lucide-react';
import { chapters, pokemonById } from '@/domain/pokemon';
import { RegionPicture } from './region-picture';
import { PokemonArt } from './pokemon-art';
export function ChapterDiscovery({ completed, quiet = false }: { completed: number; quiet?: boolean }) {
  const previous = chapters.find(chapter => chapter.id === completed);
  if (!previous) return null;
  const next = chapters.find(chapter => chapter.id === completed + 1);
  return <section className={`chapter-discovery ${quiet ? 'quiet' : ''}`} aria-label="这次相遇开启的新区域"><span className="chapter-discovery-title"><Flag size={24} /><strong>{next ? '新的地方，开启啦！' : '六站走完，世界更大啦！'}</strong></span><div className="region-transition"><div><RegionPicture chapterId={completed} /><span><Check size={17} />{previous.location.split(' · ')[0]}</span></div><ArrowRight size={30} className="region-path-arrow" aria-hidden="true" /><div className="new-region"><RegionPicture chapterId={completed + 1} /><span><Sparkles size={18} />{next?.location.split(' · ')[0] ?? '自由探索'}</span></div></div><div className="chapter-complete-friends" aria-label="这一站收齐的五位伙伴">{previous.pokemonIds.map(id => <PokemonArt key={id} pokemon={pokemonById.get(id)!} />)}</div><p>{next ? '下一次捕捉奖励，就去这里找新伙伴。' : '下一次捕捉奖励，可以在关都各处遇见新伙伴。'}</p></section>;
}
