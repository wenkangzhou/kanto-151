'use client';

import { johtoRegional } from '@/domain/johto';
import { RegionalPokedex } from './regional-pokedex';

export function JohtoPokedex() {
  return <RegionalPokedex region="johto" entries={johtoRegional} />;
}
