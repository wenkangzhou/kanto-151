'use client';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { Pokemon } from '@/domain/types';
import { collectionState, stateNames } from '@/domain/collection';
import { dexNumber } from '@/domain/pokemon';
import { useCollection } from './collection-provider';
import { PokemonArt } from './pokemon-art';
import { CollectionMark } from './collection-mark';
import { TypeBadge } from './type-badge';
export function PokemonCard({ pokemon: p, priority = false }: { pokemon: Pokemon; priority?: boolean }) {
  const { snapshot } = useCollection();
  const state = collectionState(p, snapshot);
  const known = state === 'collected' || state === 'evolvable';
  return <Link href={`/pokemon/${p.id}`} className={`pokemon-card card-${known ? p.types[0] : 'locked'} state-${state}`} aria-label={`${dexNumber(p.id)} ${known ? p.name : '未发现的宝可梦'}，${stateNames[state]}`}>
    <div className="card-top"><span className="mono">{dexNumber(p.id)}</span><CollectionMark state={state} /></div>
    <div className="card-art"><PokemonArt pokemon={p} hidden={!known} priority={priority} /></div>
    <div className="card-name">{known ? p.name : '???'}</div>
    <div className="card-subtitle">{known ? p.englishName : stateNames[state]}</div>
    <div className="card-types">{known ? p.types.map(type => <TypeBadge key={type} type={type} />) : <span className="undiscovered">{state === 'available' ? '等待一次相遇' : '冒险还在继续'}</span>}</div>
    {state === 'evolvable' && <span className="evolution-label"><Sparkles size={11} /> 可进化</span>}
  </Link>;
}
