import type { LiveSnapshot, Receipt } from './types';

// The receipt is returned only after the server commits the reward transaction.
export function includeConfirmedReceipt(snapshot: LiveSnapshot, receipt: Receipt): LiveSnapshot {
  const usedTicket = receipt.ticket_id && !receipt.kind.endsWith('-ticket') ? snapshot.tickets.find(ticket => ticket.id === receipt.ticket_id) : null;
  const hasPartner = receipt.pokemon_id !== null && snapshot.records.some(record => record.pokemonId === receipt.pokemon_id);
  const record = receipt.pokemon_id !== null && !hasPartner ? {
    pokemonId: receipt.pokemon_id, acquiredAt: receipt.created_at, reason: receipt.reason,
    method: receipt.kind === 'evolution' ? 'evolution' as const : receipt.kind === 'capture' ? 'capture' as const : 'legendary' as const,
  } : null;
  const tickets = usedTicket ? snapshot.tickets.filter(ticket => ticket.id !== usedTicket.id) : snapshot.tickets;
  const pendingCaptures = receipt.kind === 'capture' && !receipt.acknowledged_at && !snapshot.pendingCaptures?.some(item => item.id === receipt.id)
    ? [...snapshot.pendingCaptures ?? [], receipt] : snapshot.pendingCaptures;
  return {
    ...snapshot,
    records: record ? [...snapshot.records, record] : snapshot.records,
    tickets,
    inventory: {
      evolution: Math.max(0, snapshot.inventory.evolution - (usedTicket?.type === 'evolution' ? 1 : 0)),
      legendary: Math.max(0, snapshot.inventory.legendary - (usedTicket?.type === 'legendary' ? 1 : 0)),
    },
    pendingReceipt: snapshot.pendingReceipt ?? (receipt.acknowledged_at ? null : receipt),
    pendingCaptures,
  };
}

export function markReceiptViewed(snapshot: LiveSnapshot, id: string): LiveSnapshot {
  return {
    ...snapshot,
    pendingReceipt: snapshot.pendingReceipt?.id === id ? null : snapshot.pendingReceipt,
    pendingCaptures: snapshot.pendingCaptures?.filter(receipt => receipt.id !== id),
  };
}
