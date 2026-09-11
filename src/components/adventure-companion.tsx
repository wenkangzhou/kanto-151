'use client';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play, Sparkles, ChevronRight } from 'lucide-react';
import { pokemonById } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';

export function AdventureCompanion({ team }: { team: number[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const teamKey = team.join(',');
  useEffect(() => {
    if (team.length < 2 || paused || reduced) return;
    const timer = setInterval(() => { if (!document.hidden) setIndex(value => value + 1); }, 5500);
    return () => clearInterval(timer);
  }, [team.length, teamKey, index, paused, reduced]);
  const companion = pokemonById.get(team.length ? team[index % team.length] : 25)!;
  return <div className="hero-art"><span className="hero-orbit" aria-hidden="true" /><span className="hero-art-number mono" aria-hidden="true">151</span><motion.div className="companion-art" key={companion.id} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .4 }}><PokemonArt pokemon={companion} priority /></motion.div><Sparkles className="hero-sparkles" size={34} aria-hidden="true" />{team.length > 0 && <div className="companion-caption"><span>{companion.name}陪你出发</span>{team.length > 1 && !reduced && <button aria-label={paused ? '继续轮换小队伙伴' : '暂停轮换小队伙伴'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}{team.length > 1 && <button aria-label="下一位小队伙伴" onClick={() => setIndex(value => value + 1)}><ChevronRight size={19} aria-hidden="true" /></button>}</div>}</div>;
}
