import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionNeighbors, reorderTeam, swipeDirection, detailReturn, detailHref, teamNeighbors } from '../src/domain/navigation';
test('known partners navigate only collected entries, without wrapping at boundaries', () => {
  assert.deepEqual(companionNeighbors(16,[25,4,16,16]),{previous:4,next:25});
  assert.deepEqual(companionNeighbors(4,[25,4,16]),{previous:null,next:16});
  assert.deepEqual(companionNeighbors(25,[25]),{previous:null,next:null});
  assert.deepEqual(companionNeighbors(5,[4,16]),{previous:4,next:6});
});
test('swiping requires horizontal intent; scrolling and taps do not navigate', () => {
  assert.equal(swipeDirection(-90,12),'next');
  assert.equal(swipeDirection(90,-12),'previous');
  for (const [x,y] of [[5,1],[59,0],[80,100],[60,45]]) assert.equal(swipeDirection(x,y),null);
});
test('reordering inserts within the existing team, preserving all members and the expected snapshot', () => {
  const original=[25,16,19,21,52,23];
  assert.deepEqual(reorderTeam(original,25,4),[16,19,21,52,25,23]);
  assert.deepEqual(reorderTeam(original,23,0),[23,25,16,19,21,52]);
  assert.deepEqual(reorderTeam(original,109,2),original);
  assert.deepEqual(reorderTeam(original,25,6),original);
  assert.deepEqual(reorderTeam([25,16],25,1),[16,25]);
  assert.deepEqual(original,[25,16,19,21,52,23]);
});

test('detail navigation retains only trusted origins and receipt identifiers', () => {
  assert.deepEqual(detailReturn('team', null), {href:'/team', label:'回我的小队'});
  assert.equal(detailHref(25,'capture','receipt-123'), '/pokemon/25?from=capture&receipt=receipt-123');
  assert.equal(detailReturn('capture','receipt-123').href, '/capture?receipt=receipt-123');
  for (const source of ['https://example.com','//example.com','constructor','toString']) {
    assert.equal(detailReturn(source,null).href, '/pokedex');
    assert.equal(detailHref(25,source), '/pokemon/25');
  }
  assert.equal(detailReturn('capture','../parent?x=1').href, '/pokedex');
  assert.equal(detailHref(25), '/pokemon/25');
});
test('team detail follows the chosen team order without leaving the team', () => {
  assert.deepEqual(teamNeighbors(4,[25,4,7]), {previous:25,next:7});
  assert.deepEqual(teamNeighbors(25,[25,4,7]), {previous:null,next:4});
  assert.deepEqual(teamNeighbors(7,[25,4,7]), {previous:4,next:null});
  assert.deepEqual(teamNeighbors(16,[25,4,7]), {previous:null,next:null});
});
