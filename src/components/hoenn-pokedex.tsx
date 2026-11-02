'use client';

import { hoennRegional } from '@/domain/hoenn';
import { RegionalPokedex } from './regional-pokedex';

export function HoennPokedex() {
  return <RegionalPokedex region="hoenn" entries={hoennRegional} />;
}
