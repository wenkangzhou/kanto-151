import Image from 'next/image';
import type { Pokemon } from '@/domain/types';
export function PokemonArt({ pokemon, hidden = false, priority = false, className = '' }: { pokemon: Pokemon; hidden?: boolean; priority?: boolean; className?: string }) {
  return <Image className={`pokemon-art ${hidden ? 'silhouette' : ''} ${className}`} src={pokemon.artwork} alt={hidden ? '尚未发现的宝可梦剪影' : pokemon.name} width={475} height={475} priority={priority} unoptimized draggable={false} />;
}
