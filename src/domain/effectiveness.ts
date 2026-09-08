import { TYPE_NAMES, type PokemonType } from './types';
// Current main-series chart. Each row describes an attacking type.
const chart: Record<PokemonType, { double: PokemonType[]; half: PokemonType[]; zero?: PokemonType[] }> = {
  normal: { double: [], half: ['rock', 'steel'], zero: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
  grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug', 'fairy'], zero: ['ghost'] },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
  ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
  bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], zero: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
};
export function effectiveness(attack: PokemonType, defenders: PokemonType[]): number {
  return defenders.reduce((value, defense) => value * (chart[attack].zero?.includes(defense) ? 0 : chart[attack].double.includes(defense) ? 2 : chart[attack].half.includes(defense) ? 0.5 : 1), 1);
}
export function weaknesses(types: PokemonType[]) {
  return (Object.keys(TYPE_NAMES) as PokemonType[]).map(type => ({ type, multiplier: effectiveness(type, types) })).filter(result => result.multiplier > 1).sort((a, b) => b.multiplier - a.multiplier);
}
export function resistances(types: PokemonType[]) {
  return (Object.keys(TYPE_NAMES) as PokemonType[]).map(type => ({ type, multiplier: effectiveness(type, types) })).filter(result => result.multiplier < 1).sort((a, b) => a.multiplier - b.multiplier);
}
// Offensive strengths assume a same-type move against a single-type target, not a full moveset.
export function strengths(types: PokemonType[]) {
  return (Object.keys(TYPE_NAMES) as PokemonType[]).filter(target => types.some(attack => effectiveness(attack, [target]) > 1));
}
