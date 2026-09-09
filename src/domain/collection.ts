import { chapters, pokemon } from './pokemon';
import animeRoute from '@/data/anime-route.json';
import type { CollectionSnapshot, CollectionState, Pokemon } from './types';
export const collectedIds = (snapshot: CollectionSnapshot) => new Set(snapshot.records.map(record => record.pokemonId));
export function currentChapter(snapshot: CollectionSnapshot) {
  const ids = collectedIds(snapshot);
  return chapters.find(chapter => chapter.pokemonIds.some(id => !ids.has(id))) ?? null;
}
export function capturePool(snapshot: CollectionSnapshot): Pokemon[] {
  const ids = collectedIds(snapshot);
  const chapter = currentChapter(snapshot);
  const order = chapter?.pokemonIds ?? animeRoute.encounters.map(entry => entry.pokemonId).filter(id => pokemon.some(p => p.id === id && p.category === 'exploration'));
  const next = order.find(id => !ids.has(id));
  return next === undefined ? [] : pokemon.filter(p => p.id === next);
}
export function evolutionOptions(snapshot: CollectionSnapshot): Pokemon[] {
  const ids = collectedIds(snapshot);
  return pokemon.filter(p => p.evolvesFrom !== null && ids.has(p.evolvesFrom) && !ids.has(p.id));
}
export function legendaryEligible(id: number, snapshot: CollectionSnapshot): boolean {
  const ids = collectedIds(snapshot);
  if (ids.has(id)) return false;
  switch (id) {
    case 144: return ids.size >= 60;
    case 145: return ids.size >= 80;
    case 146: return ids.size >= 100;
    case 150: return ids.size >= 140 && currentChapter(snapshot) === null;
    case 151: return ids.size === 150;
    default: return false;
  }
}
export function collectionState(p: Pokemon, snapshot: CollectionSnapshot): CollectionState {
  if (collectedIds(snapshot).has(p.id)) {
    return snapshot.inventory.evolution > 0 && evolutionOptions(snapshot).some(option => option.evolvesFrom === p.id) ? 'evolvable' : 'collected';
  }
  if (p.category === 'legendary') return legendaryEligible(p.id, snapshot) ? 'available' : 'locked';
  if (p.category === 'evolution') {
    if (!evolutionOptions(snapshot).some(option => option.id === p.id)) return 'locked';
    return snapshot.inventory.evolution > 0 ? 'evolution-ready' : 'needs-evolution-ticket';
  }
  return capturePool(snapshot).some(option => option.id === p.id) ? 'available' : 'locked';
}
export const stateNames: Record<CollectionState, string> = { locked: '未发现', available: '可遇见', collected: '已收集', evolvable: '可进化', 'evolution-ready': '可进化获得', 'needs-evolution-ticket': '需要进化券' };
export function unlockHint(p: Pokemon, snapshot: CollectionSnapshot): string {
  if (p.id === 151) return '与前 150 位伙伴相遇后，最后的奇迹会自动开启，无需传说券。';
  if (p.category === 'legendary') return `收集 ${p.id === 144 ? 60 : p.id === 145 ? 80 : p.id === 146 ? 100 : 140} 只宝可梦${p.id === 150 ? '并完成所有故事章节' : ''}后，可使用传说券相遇。`;
  if (p.category === 'evolution') {
    const state = collectionState(p, snapshot);
    if (state === 'evolution-ready') return '可以去背包使用一张进化券，认识这个新模样。原来的伙伴会一直保留。';
    if (state === 'needs-evolution-ticket') return '已经认识它的前一个形态，再获得一张进化券，就能认识这个新模样。普通捕捉奖励不会遇到它。';
    return '先收集它的前一个形态，再使用进化券认识它。普通捕捉奖励不会遇到它，原来的伙伴会一直保留。';
  }
  if (capturePool(snapshot).some(option => option.id === p.id)) return '下一次捕捉奖励，就会与这位动画伙伴相遇。';
  return p.category === 'story' ? '跟着动画继续冒险，按故事顺序认识前面的伙伴后，就会轮到它。' : '动画主线走完后，会按顺序补齐特别篇和额外的伙伴。';
}
