import { TYPE_NAMES, type PokemonType } from '@/domain/types';
export function TypeBadge({ type, multiplier }: { type: PokemonType; multiplier?: number }) {
  return <span className={`type-badge type-${type}`}><span className="type-dot" />{TYPE_NAMES[type]}{multiplier !== undefined && <b>×{multiplier}</b>}</span>;
}
