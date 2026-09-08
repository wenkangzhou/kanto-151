import { CircleDot, Flame, Droplets, Zap, Leaf, Snowflake, Swords, Skull, Globe, Wind, Eye, Bug, Mountain, Ghost, Moon, Cog, Sparkles, type LucideIcon } from 'lucide-react';
import { TYPE_NAMES, type PokemonType } from '@/domain/types';

// lucide 没有龙形图标，这里用线条画一只小翼龙
function DragonIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 17c2.5-5.5 5 1 7.5-4.5S16 5.5 20 7" />
      <path d="m18 4.2 1 1.9" />
      <path d="m20.6 4.4.4 2" />
    </svg>
  );
}

const TYPE_ICONS: Record<PokemonType, LucideIcon | typeof DragonIcon> = {
  normal: CircleDot, fire: Flame, water: Droplets, electric: Zap, grass: Leaf, ice: Snowflake,
  fighting: Swords, poison: Skull, ground: Globe, flying: Wind, psychic: Eye,
  bug: Bug, rock: Mountain, ghost: Ghost, dragon: DragonIcon, dark: Moon, steel: Cog, fairy: Sparkles,
};

export function TypeBadge({ type, multiplier }: { type: PokemonType; multiplier?: number }) {
  const Icon = TYPE_ICONS[type];
  return <span className={`type-badge type-${type}`}><span className="type-icon" aria-hidden="true"><Icon size={12} /></span>{TYPE_NAMES[type]}{multiplier !== undefined && <b>×{multiplier}</b>}</span>;
}

export function TypePicture({ type }: { type: PokemonType }) {
  const Icon = TYPE_ICONS[type];
  return <span className={`type-picture type-${type}`}><Icon size={32} aria-hidden="true" /><span>{TYPE_NAMES[type]}</span></span>;
}
