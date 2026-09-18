import type { InventoryTicket } from './types';
/** A direct item action skips choosing a ticket only when there is exactly one matching ticket. */
export function ticketEntry(tickets: InventoryTicket[], type?: InventoryTicket['type']) {
  const matching = type ? tickets.filter(ticket => ticket.type === type) : tickets;
  return { matching, selectedId: type && matching.length === 1 ? matching[0].id : '' };
}
