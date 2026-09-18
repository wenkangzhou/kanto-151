import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ticketEntry } from '../src/domain/ticket-navigation';
import type { InventoryTicket } from '../src/domain/types';
const evolution: InventoryTicket = {id:'e1',type:'evolution',reason:'练习',createdAt:'2026-09-18'};
const legendary: InventoryTicket = {...evolution,id:'l1',type:'legendary'};
test('direct item entry picks the only matching ticket without selecting another kind', () => {
  assert.equal(ticketEntry([legendary,evolution],'evolution').selectedId,'e1');
  assert.deepEqual(ticketEntry([legendary],'evolution'),{matching:[],selectedId:''});
  assert.equal(ticketEntry([evolution]).selectedId,'');
});
test('multiple matching rewards retain the choice of which memory to use', () => {
  const tickets = [evolution,legendary,{...evolution,id:'e2'}];
  assert.deepEqual(ticketEntry(tickets,'evolution'),{matching:[tickets[0],tickets[2]],selectedId:''});
  assert.equal(tickets.length,3);
  assert.deepEqual(ticketEntry([],'legendary'),{matching:[],selectedId:''});
});
