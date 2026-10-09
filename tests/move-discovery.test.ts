import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoverMove} from '../src/domain/move-discovery';
import {defaultSlots,machineAvailable,slotMoves} from '../src/domain/battle-loadout';
test('discovery only offers unequipped, legal and free moves across all partners',()=>{
 for(let id=1;id<=151;id++){
  const offer=discoverMove([id]);
  if(!offer)continue;
  assert.equal(offer.id,id);
  assert.ok(slotMoves(id,offer.slot).some(m=>m.id===offer.move.id));
  assert.ok(!defaultSlots(id).includes(offer.move.id));
  assert.ok(offer.slot<2||machineAvailable(id,offer.move.id));
 }
});
test('discovery respects saved presets and skips partners without alternatives',()=>{
 assert.equal(discoverMove([]),null);
 assert.equal(discoverMove([132]),null);
 const first=discoverMove([25])!;
 assert.ok(first);
 const saved=defaultSlots(25);saved[first.slot]=first.move.id;
 const next=discoverMove([132,25],{'25':saved});
 assert.ok(next);assert.equal(next.id,25);assert.ok(!saved.includes(next.move.id));
});
