'use client';

import { johtoRegional } from '@/domain/johto';
import { RegionalPokedex } from './regional-pokedex';

export function JohtoPokedex({ initialPokemonId }: { initialPokemonId?: number }) {
  return <RegionalPokedex region="johto" entries={johtoRegional} initialPokemonId={initialPokemonId} />;
}
