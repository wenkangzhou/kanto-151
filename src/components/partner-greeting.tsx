'use client';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Pokemon } from '@/domain/types';
import { PokemonArt } from './pokemon-art';

/** A greeting never changes collection or team membership. */
export function PartnerGreeting({ pokemon }: { pokemon: Pokemon }) {
  const reduced = useReducedMotion();
  const [greeting, setGreeting] = useState(0);
  return <button type="button" className="partner-greeting" aria-label={`和${pokemon.name}打招呼`} onClick={() => setGreeting(count => count + 1)}>
    <motion.span key={greeting} className="greeting-art" animate={greeting && !reduced ? { y: [0, -14, 0, -7, 0], rotate: [0, -5, 5, 0] } : { y: 0, rotate: 0 }} transition={{ duration: .65 }}><PokemonArt pokemon={pokemon} /></motion.span>
    {greeting > 0 ? <motion.span key={`reply-${greeting}`} className="greeting-reply" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.4, duration: .3 }} aria-hidden="true"><Sparkles size={22} />♪</motion.span> : null}
  </button>;
}
