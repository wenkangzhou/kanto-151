import { pokemonById } from './pokemon';
import type { CollectionRecord, PokemonType } from './types';
export type CenterSort = 'recent' | 'number';
export function centerPartners(records: CollectionRecord[], team: number[], type: PokemonType | 'all', sort: CenterSort) {
  return records.filter(record => !team.includes(record.pokemonId) && (type === 'all' || pokemonById.get(record.pokemonId)?.types.includes(type)))
    .sort((a, b) => (sort === 'recent' ? Date.parse(b.acquiredAt) - Date.parse(a.acquiredAt) : 0) || a.pokemonId - b.pokemonId);
}
