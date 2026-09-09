export const TYPE_NAMES = {
  normal: '一般', fire: '火', water: '水', electric: '电', grass: '草', ice: '冰',
  fighting: '格斗', poison: '毒', ground: '地面', flying: '飞行', psychic: '超能力',
  bug: '虫', rock: '岩石', ghost: '幽灵', dragon: '龙', dark: '恶', steel: '钢', fairy: '妖精',
} as const;
export type PokemonType = keyof typeof TYPE_NAMES;
export type Stats = Record<'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed', number>;
export interface Pokemon {
  id: number; name: string; traditionalName: string; englishName: string;
  types: PokemonType[]; kantoEraTypes: PokemonType[]; stats: Stats;
  height: number; weight: number; description: string; evolvesFrom: number | null;
  artwork: string; artworkSource: string;
  category: 'story' | 'exploration' | 'evolution' | 'legendary';
  rarity: 'common' | 'rare' | 'veryRare';
}
export type CollectionState = 'locked' | 'available' | 'collected' | 'evolvable';
export interface CollectionRecord {
  pokemonId: number; acquiredAt: string; reason: string; method: 'capture' | 'evolution' | 'legendary';
}
export interface CollectionSnapshot {
  records: CollectionRecord[];
  inventory: { evolution: number; legendary: number };
  source: 'demo' | 'empty' | 'supabase';
}
export interface Chapter { id: number; name: string; location: string; description: string; pokemonIds: number[] }
export interface CollectionRepository { getSnapshot(): Promise<CollectionSnapshot> }

export interface InventoryTicket { id: string; type: 'evolution' | 'legendary'; reason: string; createdAt: string }
export interface Receipt {
  id: string; kind: 'capture' | 'evolution-ticket' | 'legendary-ticket' | 'evolution' | 'legendary' | 'mew';
  pokemon_id: number | null; from_pokemon_id: number | null; ticket_id: string | null;
  reason: string; created_at: string; acknowledged_at: string | null; completed_chapter?: number | null;
}
export interface LiveSnapshot extends CollectionSnapshot { tickets: InventoryTicket[]; pendingReceipt: Receipt | null }
export interface FamilySession {
  status: 'ready' | 'demo' | 'setup-required' | 'unpaired';
  parent?: boolean; parentExpiresAt?: number | null; familyName?: string; childName?: string; snapshot?: LiveSnapshot;
}
export interface ParentReward {
  id: string; code: string; type: 'capture' | 'evolution' | 'legendary'; reason: string;
  created_at: string; expires_at: string; redeemed_at: string | null; revoked_at: string | null;
}
