import type { ParentReward } from './types';
export function rewardType(value: unknown): ParentReward['type'] {
  return value === 'evolution' || value === 'legendary' ? value : 'capture';
}
type RewardRow = ParentReward & { receipt_id: string | null };
type TicketRow = { reward_id: string; used_at: string | null; receipt_id: string | null };
type ReceiptRow = { id: string; pokemon_id: number | null; from_pokemon_id: number | null };
export function rewardOutcomes(rewards: RewardRow[], tickets: TicketRow[], receipts: ReceiptRow[]): ParentReward[] {
  const ticketByReward = new Map(tickets.map(t => [t.reward_id,t]));
  const receiptById = new Map(receipts.map(r => [r.id,r]));
  return rewards.map(({receipt_id,...reward}) => {
    if(!reward.redeemed_at)return reward;
    const ticket=ticketByReward.get(reward.id);
    const receipt=receiptById.get((reward.type==='capture'?receipt_id:ticket?.receipt_id) ?? '');
    return {...reward,outcome:{state:reward.type==='capture'?'met':ticket?.used_at?'used':ticket?'stored':'received',usedAt:ticket?.used_at??null,pokemonId:receipt?.pokemon_id??null,fromPokemonId:receipt?.from_pokemon_id??null}};
  });
}
