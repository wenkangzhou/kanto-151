import { TYPE_NAMES, type PokemonType } from '@/domain/types';
import { TypeSymbol } from './type-symbol';

export function TypeBadge({ type, multiplier }: { type: PokemonType; multiplier?: number }) {
  return <span className={`type-badge type-${type}`}><span className="type-icon"><TypeSymbol type={type} size={18} /></span>{TYPE_NAMES[type]}{multiplier !== undefined && <b>×{multiplier}</b>}</span>;
}

export function TypePicture({ type }: { type: PokemonType }) {
  return <span className={`type-picture type-${type}`}><TypeSymbol type={type} size={32} /><span>{TYPE_NAMES[type]}</span></span>;
}
