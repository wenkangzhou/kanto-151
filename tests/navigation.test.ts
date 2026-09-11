import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionNeighbors, reorderTeam, swipeDirection } from '../src/domain/navigation';
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
