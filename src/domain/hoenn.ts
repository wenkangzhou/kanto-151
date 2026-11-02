import data from '@/data/hoenn-pokemon.json';
import regionalOrder from '@/data/hoenn-regional-order.json';
import { pokemon as kantoPokemon } from './pokemon';
import { johtoPokemon, type JohtoPokemon } from './johto';
import type { Pokemon } from './types';

export type HoennPokemon = JohtoPokemon;
export const hoennPokemon = data as HoennPokemon[];
export type HoennEntry = (Pokemon | JohtoPokemon | HoennPokemon) & { regionalNumber: number; newInHoenn: boolean };
const byId = new Map<number, Pokemon | JohtoPokemon | HoennPokemon>([...kantoPokemon, ...johtoPokemon, ...hoennPokemon].map(pokemon => [pokemon.id, pokemon]));
export const hoennRegional: HoennEntry[] = regionalOrder.map((id, index) => {
  const pokemon = byId.get(id);
  if (!pokemon) throw new Error(`Missing Hoenn regional entry ${id}`);
  return { ...pokemon, regionalNumber: index + 1, newInHoenn: id >= 252 };
});
