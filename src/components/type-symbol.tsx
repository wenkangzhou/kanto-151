import type { PokemonType } from '@/domain/types';

// Local silhouettes redrawn from the visual language of the supplied 52Poké references.
// Transparent cutouts remain crisp at both badge and teaching-card sizes.
const paths: Record<PokemonType, string> = {
  normal: 'M16 3a13 13 0 1 1 0 26 13 13 0 0 1 0-26ZM16 7a9 9 0 1 1 0 18 9 9 0 0 1 0-18ZM5 7 2 4 5 1 9 4ZM23 4 27 1 30 4 27 7Z',
  fire: 'M17 1C20 9 10 10 15 17 12 16 11 12 11 10 3 16 4 25 11 29 8 22 14 21 16 16 15 22 23 22 19 30 30 27 29 18 23 13 24 19 19 18 20 13 23 8 19 4 17 1Z',
  water: 'M16 1C13 7 5 15 5 21a11 11 0 0 0 22 0C27 15 19 7 16 1ZM8 22C12 26 20 26 24 22 23 30 9 30 8 22Z',
  electric: 'M14 1 5 16 13 20 10 31 27 14 19 10 25 5Z',
  grass: 'M3 28C3 18 7 11 10 6L8 28ZM10 30C11 18 15 7 21 1L16 30ZM19 30C21 20 25 11 30 7L25 30Z',
  ice: 'M14 2h4v7l-2 3-2-3ZM14 23l2-3 2 3v7h-4ZM2 7l4-2 6 4v4l-4-1ZM20 19l4 1 6 5-4 2-6-4ZM2 25l6-5 4-1v4l-6 4ZM20 9l6-4 4 2-6 5-4 1ZM16 11l5 5-5 5-5-5Z',
  fighting: 'M6 15V8a3 3 0 0 1 5-2V5a3 3 0 0 1 5-2 3 3 0 0 1 5 2 3 3 0 0 1 5 2v10l-3 6v6H10v-5l-6-7a3 3 0 0 1 2-5Zm5-6v7h2V9Zm5-2v9h2V7Zm5 2v7h2V9Z',
  poison: 'M14 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM25 12a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM9 18a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM16 25C-3 25-3 32 16 32s19-7 0-7Z',
  ground: 'M5 2h5v5H5ZM23 6h4v4h-4ZM14 11h3v3h-3ZM2 21l14-6 14 6-14 6ZM2 25l14 5 14-5v3l-14 5-14-5Z',
  flying: 'M2 29 8 10C13 10 24 7 31 2 27 13 18 15 11 16 17 17 21 15 25 14 21 21 15 22 9 22 13 23 16 23 19 22 16 27 10 27 6 26L5 30Z',
  psychic: 'M16 1 21 6 28 7 27 15 31 21 24 25 21 31 14 28 7 30 5 23 0 18 5 12 6 5 13 5ZM16 6 12 9 9 9 9 14 5 18 9 21 10 26 15 24 19 26 21 22 26 20 23 16 24 11 19 10Z',
  bug: 'M16 2C12 2 9 4 8 7l8 5 8-5c-1-3-4-5-8-5ZM6 10C1 16 3 25 10 29l3-14ZM26 10l-7 5 3 14c7-4 9-13 4-19ZM15 16h2l3 14h-8ZM14 21v3h4v-3Z',
  rock: 'M7 3h17l7 8-2 13-10 7L4 26 1 13ZM9 5l-5 8 4 11 10 5-7-8-5-8ZM25 8l2 14-7 6 10-5 1-11Z',
  ghost: 'M4 16a12 12 0 0 1 24 0v7l3 5-8-1-3 4-5-3-6 2-2-5-6-1Zm6-3v7l5-3Zm12 0-5 4 5 3Z',
  dragon: 'M10 2 12 10 16 5 20 10 23 2 26 14 30 9 29 21 24 27 25 19 21 24 21 29 16 32 11 29 11 24 7 19 8 27 3 21 2 9 6 14ZM9 16l3 5 2-1-2-4Zm14 0-3 5-2-1 2-4Z',
  dark: 'M5 5a14 14 0 1 0 22 0l-4 6a8 8 0 1 1-14 0ZM16 8l4 6-4 9-4-9Z',
  steel: 'M7 3 28 7 31 25 12 31 1 19ZM10 7l-4 9 8-2Zm10 4 2 8 5-2-2-7ZM10 20l5 7 1-10Z',
  fairy: 'M15 12C13 3 1 1 2 10c0 5 5 8 10 7-7 4-4 10 2 6l-3 9 5-6 5 6-3-9c6 4 9-2 2-6 5 1 10-2 10-7 1-9-11-7-13 2ZM16 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
};

export function TypeSymbol({ type, size = 24 }: { type: PokemonType; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 34" fill="currentColor" aria-hidden="true" focusable="false"><path d={paths[type]} fillRule="evenodd" /></svg>;
}
