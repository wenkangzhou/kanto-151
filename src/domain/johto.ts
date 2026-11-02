import data from '@/data/johto-pokemon.json';
import regionalOrder from '@/data/johto-regional-order.json';
import { pokemon as kantoPokemon } from './pokemon';
import type { Pokemon, PokemonType } from './types';

export type JohtoPokemon = {
  id: number;
  name: string;
  traditionalName: string;
  englishName: string;
  genus: string;
  types: PokemonType[];
  description: string;
  evolvesFrom: number | null;
  height: number;
  weight: number;
  artwork: string;
  artworkSource: string;
};

export const johtoPokemon = data as JohtoPokemon[];
export const johtoFromKanto = johtoPokemon.filter(pokemon => pokemon.evolvesFrom !== null && pokemon.evolvesFrom <= 151);
export type JohtoEntry = (JohtoPokemon | Pokemon) & { regionalNumber: number; newInJohto: boolean };
const byId = new Map<number, JohtoPokemon | Pokemon>([...kantoPokemon, ...johtoPokemon].map(pokemon => [pokemon.id, pokemon]));
export const johtoRegional: JohtoEntry[] = regionalOrder.map((id, index) => {
  const pokemon = byId.get(id);
  if (!pokemon) throw new Error(`Missing Johto regional entry ${id}`);
  return { ...pokemon, regionalNumber: index + 1, newInJohto: id >= 152 };
});
