import {TYPE_NAMES} from './types';

export const guideTypes = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel'] as const;
export type GuideType = typeof guideTypes[number];
// FireRed / LeafGreen (Generation III). Kept separate from the app's modern battle rules.
// Reference: https://pokemondb.net/type/old (Generation 2–5 chart).
const chart: Record<GuideType, { double: GuideType[]; half: GuideType[]; zero?: GuideType[] }> = {
  normal: { double: [], half: ['rock', 'steel'], zero: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
  grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug'], zero: ['ghost'] },
  poison: { double: ['grass'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
  ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
  bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel'] },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark', 'steel'], zero: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'steel'] },
  steel: { double: ['ice', 'rock'], half: ['fire', 'water', 'electric', 'steel'] },
};
export function guideEffectiveness(attack:GuideType, defenders:readonly GuideType[]):number {
 return [...new Set(defenders)].reduce((n,d)=>n*(chart[attack].zero?.includes(d)?0:chart[attack].double.includes(d)?2:chart[attack].half.includes(d) ? 0.5 : 1),1);
}
export function multiplierLabel(value:number){return value===.25?'¼':value===.5?'½':String(value);}
export function matchupNarration(attack:GuideType,defenders:readonly GuideType[]){
 const n=guideEffectiveness(attack,defenders);
 const effect=n===0?'没有效果':n===1?'效果正常':n>1?'效果绝佳':'效果不太好';
 const amount=n===.25?'四分之一':n===.5?'一半':`${n}倍`;
 return `${TYPE_NAMES[attack]}属性招式，打中${defenders.map(d=>TYPE_NAMES[d]).join('和')}属性的宝可梦，${effect}。${n===0?'':`属性倍率是通常的${amount}。`}`;
}
export const guideColors:Record<GuideType,string>={normal:'#878b88',fire:'#dc5347',water:'#3986c5',electric:'#bb9008',grass:'#56934e',ice:'#408e9e',fighting:'#b96138',poison:'#9953bb',ground:'#a47643',flying:'#638dc5',psychic:'#d65385',bug:'#899b25',rock:'#948757',ghost:'#77659f',dragon:'#636ac3',dark:'#686273',steel:'#678790'};
