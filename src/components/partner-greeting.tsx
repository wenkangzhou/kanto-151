'use client';
import { useT } from '@/lib/i18n/locale';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Pokemon } from '@/domain/types';
import { PokemonArt } from './pokemon-art';

/** A greeting never changes collection or team membership. */
export function PartnerGreeting({ pokemon }: { pokemon: Pokemon }) {
  const localize = useT();
  const reduced = useReducedMotion();
  const [greeting, setGreeting] = useState(0);
  return <button type="button" className="partner-greeting" aria-label={localize(`和${pokemon.name}打招呼`)} onClick={() => { setGreeting(count => count + 1); }}>
    <motion.span key={greeting} className="greeting-art" animate={greeting && !reduced ? { y: [0, -14, 0, -7, 0], rotate: [0, -5, 5, 0] } : { y: 0, rotate: 0 }} transition={{ duration: .65 }}><PokemonArt pokemon={pokemon} sizes="320px" priority /></motion.span>
  </button>;
}
