import data from '@/data/pokemon.json';
import chaptersData from '@/data/chapters.json';
import type { Chapter, Pokemon } from './types';
export const pokemon = data as Pokemon[];
export const chapters = chaptersData as Chapter[];
export const pokemonById = new Map(pokemon.map(p => [p.id, p]));
export const dexNumber = (id: number) => `#${String(id).padStart(3, '0')}`;
export const baseStatTotal = (p: Pokemon) => Object.values(p.stats).reduce((a, b) => a + b, 0);
export function evolutionFamily(p: Pokemon): Pokemon[] {
  let root = p;
  while (root.evolvesFrom && pokemonById.has(root.evolvesFrom)) root = pokemonById.get(root.evolvesFrom)!;
  const family: Pokemon[] = [];
  const visit = (node: Pokemon) => { family.push(node); pokemon.filter(candidate => candidate.evolvesFrom === node.id).forEach(visit); };
  visit(root);
  return family;
}
export const statLabels = { hp: '体力', attack: '攻击', defense: '防御', 'special-attack': '特攻', 'special-defense': '特防', speed: '速度' } as const;
export function strengthSummary(p: Pokemon) {
  const highest = Math.max(...Object.values(p.stats));
  const strongestStats = (Object.keys(statLabels) as (keyof typeof statLabels)[])
    .filter(stat => p.stats[stat] === highest)
    .map(stat => statLabels[stat]);
  return `六项种族值中，${strongestStats.join('、')}最高（${highest}）。`;
}
