import { chapters, pokemon } from './pokemon';
import type { CollectionSnapshot, CollectionState, Pokemon } from './types';
export const collectedIds = (snapshot: CollectionSnapshot) => new Set(snapshot.records.map(record => record.pokemonId));
export function currentChapter(snapshot: CollectionSnapshot) {
  const ids = collectedIds(snapshot);
  return chapters.find(chapter => chapter.pokemonIds.some(id => !ids.has(id))) ?? null;
}
export function capturePool(snapshot: CollectionSnapshot): Pokemon[] {
  const ids = collectedIds(snapshot);
  const chapter = currentChapter(snapshot);
  return pokemon.filter(p => !ids.has(p.id) && (chapter ? chapter.pokemonIds.includes(p.id) : p.category === 'exploration'));
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
  if (p.category === 'evolution') return evolutionOptions(snapshot).some(option => option.id === p.id) ? 'available' : 'locked';
  return capturePool(snapshot).some(option => option.id === p.id) ? 'available' : 'locked';
}
export const stateNames: Record<CollectionState, string> = { locked: '未发现', available: '可遇见', collected: '已收集', evolvable: '可进化' };
export function unlockHint(p: Pokemon, snapshot: CollectionSnapshot): string {
  if (p.id === 151) return '与前 150 位伙伴相遇后，最后的奇迹会自动开启，无需传说券。';
  if (p.category === 'legendary') return `收集 ${p.id === 144 ? 60 : p.id === 145 ? 80 : p.id === 146 ? 100 : 140} 只宝可梦${p.id === 150 ? '并完成所有故事章节' : ''}后，可使用传说券相遇。`;
  if (p.category === 'evolution') return '收集它的前一个形态后，使用进化券就能认识它。原来的伙伴会一直保留。';
  if (capturePool(snapshot).some(option => option.id === p.id)) return '它就在当前冒险区域里。未来兑换捕捉奖励时，有机会与它相遇。';
  return p.category === 'story' ? '继续收集当前章节的伙伴，新的区域就会开启。' : '完成所有故事章节后，可以在自由探索中与它相遇。';
}
