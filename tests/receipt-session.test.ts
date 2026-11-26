import assert from 'node:assert/strict';
import { test } from 'node:test';
import { includeConfirmedReceipt, markReceiptViewed } from '../src/domain/receipt-session';
import type { LiveSnapshot, Receipt } from '../src/domain/types';

const base = (): LiveSnapshot => ({
  source: 'supabase', records: [{ pokemonId: 4, acquiredAt: '2026-01-01', reason: '', method: 'capture' }],
  inventory: { evolution: 1, legendary: 0 },
  tickets: [{ id: 'ticket-1', type: 'evolution', reason: '努力学习', createdAt: '2026-01-02' }],
  pendingReceipt: null, pendingCaptures: [],
});

test('confirmed evolution updates the local collection once and removes the used ticket', () => {
  const receipt: Receipt = { id: 'receipt-1', kind: 'evolution', pokemon_id: 5, from_pokemon_id: 4,
    ticket_id: 'ticket-1', reason: '努力学习', created_at: '2026-01-03', acknowledged_at: null };
  const first = includeConfirmedReceipt(base(), receipt);
  assert.deepEqual(first.records.map(record => record.pokemonId), [4, 5]);
  assert.equal(first.inventory.evolution, 0);
  assert.deepEqual(first.tickets, []);
  assert.equal(first.pendingReceipt?.id, receipt.id);
  assert.deepEqual(includeConfirmedReceipt(first, receipt), first);
  const viewed = markReceiptViewed(first, receipt.id);
  assert.equal(viewed.pendingReceipt, null);
  assert.equal(viewed.records.length, 2);
});

test('confirmed capture stays available until viewed; a ticket reward does not invent inventory', () => {
  const capture: Receipt = { id: 'capture-1', kind: 'capture', pokemon_id: 25, from_pokemon_id: null,
    ticket_id: null, reason: '完成练习', created_at: '2026-01-03', acknowledged_at: null };
  const first = includeConfirmedReceipt(base(), capture);
  assert.deepEqual(first.pendingCaptures?.map(item => item.id), ['capture-1']);
  assert.equal(markReceiptViewed(first, capture.id).pendingCaptures?.length, 0);
  const gift: Receipt = { ...capture, id: 'gift-1', kind: 'legendary-ticket', pokemon_id: null, ticket_id: 'ticket-2' };
  const added = includeConfirmedReceipt(first, gift);
  assert.equal(added.inventory.legendary, 0);
  assert.equal(added.tickets.length, 1);
  assert.deepEqual(includeConfirmedReceipt(added, gift), added);
});
