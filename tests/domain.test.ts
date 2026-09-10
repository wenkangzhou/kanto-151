import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { pokemon, chapters, pokemonById, evolutionFamily, baseStatTotal } from '../src/domain/pokemon';
import { defaultExampleType, effectiveness, weaknesses, strengths, resistances } from '../src/domain/effectiveness';
import { capturePool, collectionState, currentChapter, evolutionOptions, legendaryEligible } from '../src/domain/collection';
import { emptySnapshot, demoSnapshot } from '../src/data/demo';
import type { CollectionSnapshot } from '../src/domain/types';
const snapshotWith = (ids: number[]): CollectionSnapshot => ({ source: 'demo', inventory: { evolution: 1, legendary: 1 }, records: ids.map(pokemonId => ({ pokemonId, method: 'capture', acquiredAt: '2026-09-01T00:00:00Z', reason: '测试成长记录' })) });
test('all 151 unique Kanto records have multilingual names, artwork, six stats and valid chains', () => {
  assert.equal(pokemon.length, 151);
  assert.deepEqual(pokemon.map(p => p.id), Array.from({ length: 151 }, (_, index) => index + 1));
  for (const p of pokemon) {
    assert.ok(p.name && p.traditionalName && p.englishName && p.description);
    assert.equal(Object.keys(p.stats).length, 6);
    assert.ok(Object.values(p.stats).every(value => Number.isInteger(value) && value > 0));
    assert.ok(existsSync(`public${p.artwork}`));
    assert.ok(p.evolvesFrom === null || pokemonById.has(p.evolvesFrom));
    assert.equal(new Set(evolutionFamily(p).map(n => n.id)).size, evolutionFamily(p).length);
  }
});
test('current stats and post-Kanto types remain separate from historical types', () => {
  assert.equal(baseStatTotal(pokemonById.get(6)!), 534);
  assert.deepEqual(pokemonById.get(35)!.types, ['fairy']);
  assert.deepEqual(pokemonById.get(35)!.kantoEraTypes, ['normal']);
  assert.deepEqual(pokemonById.get(81)!.types, ['electric', 'steel']);
  assert.deepEqual(pokemonById.get(81)!.kantoEraTypes, ['electric']);
  assert.deepEqual(pokemonById.get(122)!.kantoEraTypes, ['psychic']);
});
test('dual-type weaknesses multiply and immunities take priority', () => {
  assert.equal(effectiveness('rock', ['fire', 'flying']), 4);
  assert.equal(effectiveness('electric', ['water', 'flying']), 4);
  assert.equal(effectiveness('ice', ['dragon', 'flying']), 4);
  assert.equal(effectiveness('ground', ['electric', 'flying']), 0);
  assert.equal(effectiveness('grass', ['fire', 'flying']), 0.25);
  assert.equal(effectiveness('fire', ['water', 'ice']), 1);
  assert.equal(effectiveness('dragon', ['fairy']), 0);
  assert.ok(weaknesses(['fire', 'flying']).some(w => w.type === 'rock' && w.multiplier === 4));
  assert.ok(strengths(['fire']).includes('steel'));
});
test('chapter advancement ignores evolutions, capture pools exclude duplicates and legends', () => {
  const first = chapters[0];
  assert.deepEqual(capturePool(emptySnapshot).map(p => p.id), [25]);
  const completed = snapshotWith(first.pokemonIds);
  assert.equal(currentChapter(completed)?.id, 2);
  assert.ok(capturePool(completed).every(p => !first.pokemonIds.includes(p.id) && p.category === 'story'));
  const storyComplete = snapshotWith(chapters.flatMap(c => c.pokemonIds));
  assert.equal(currentChapter(storyComplete), null);
  assert.ok(capturePool(storyComplete).length > 0);
  assert.ok(capturePool(storyComplete).every(p => p.category === 'exploration'));
  assert.equal(capturePool(snapshotWith(pokemon.map(p => p.id))).length, 0);
});
test('Eevee has three independent Kanto evolutions and originals remain eligible', () => {
  const eevee = snapshotWith([133]);
  assert.deepEqual(evolutionOptions(eevee).map(p => p.id), [134, 135, 136]);
  assert.deepEqual(evolutionOptions(snapshotWith([133, 134])).map(p => p.id), [135, 136]);
  assert.equal(collectionState(pokemonById.get(133)!, eevee), 'evolvable');
  assert.equal(collectionState(pokemonById.get(133)!, { ...eevee, inventory: { evolution: 0, legendary: 0 } }), 'collected');
  assert.equal(collectionState(pokemonById.get(25)!, emptySnapshot), 'available');
  assert.equal(collectionState(pokemonById.get(151)!, emptySnapshot), 'locked');
  assert.equal(new Set(demoSnapshot.records.map(r => r.pokemonId)).size, demoSnapshot.records.length);
});
test('legendary thresholds and the ticket-free final Mew encounter', () => {
  const first = (count: number) => snapshotWith(Array.from({ length: count }, (_, i) => i + 1));
  assert.equal(legendaryEligible(144, first(59)), false);
  assert.equal(legendaryEligible(144, first(60)), true);
  assert.equal(legendaryEligible(145, first(79)), false);
  assert.equal(legendaryEligible(145, first(80)), true);
  assert.equal(legendaryEligible(146, first(100)), true);
  assert.equal(legendaryEligible(150, first(140)), false); // Aerodactyl / Snorlax story encounters are incomplete.
  assert.equal(legendaryEligible(150, snapshotWith([...Array.from({ length: 138 }, (_, i) => i + 1), 140, 142, 143])), true);
  assert.equal(legendaryEligible(151, first(149)), false);
  const final = { ...first(150), inventory: { evolution: 0, legendary: 0 } };
  assert.equal(legendaryEligible(151, final), true);
  assert.equal(legendaryEligible(151, first(151)), false);
});
test('undiscovered evolution forms distinguish missing predecessor, missing ticket and ready', () => {
  const charmeleon = pokemonById.get(5)!;
  const withoutTicket = { ...snapshotWith([4]), inventory: { evolution: 0, legendary: 0 } };
  assert.equal(collectionState(charmeleon, withoutTicket), 'needs-evolution-ticket');
  assert.equal(collectionState(charmeleon, snapshotWith([4])), 'evolution-ready');
  assert.equal(collectionState(charmeleon, snapshotWith([])), 'locked');
  assert.equal(collectionState(pokemonById.get(6)!, snapshotWith([4])), 'locked');
  assert.equal(collectionState(charmeleon, { ...snapshotWith([4, 5]), inventory: { evolution: 0, legendary: 0 } }), 'collected');
  assert.equal(collectionState(charmeleon, snapshotWith([4, 5])), 'evolvable');
  for (const snapshot of [withoutTicket, snapshotWith([4])]) {
    assert.equal(capturePool(snapshot).some(p => p.id === 5), false);
    assert.equal(collectionState(pokemonById.get(25)!, snapshot), 'available');
  }
  for (const id of [134, 135, 136]) {
    assert.equal(collectionState(pokemonById.get(id)!, snapshotWith([133])), 'evolution-ready');
    assert.equal(collectionState(pokemonById.get(id)!, { ...snapshotWith([133]), inventory: { evolution: 0, legendary: 0 } }), 'needs-evolution-ticket');
  }
});

test('anime route has one next encounter and skips every previously collected partner', () => {
  const route = chapters.flatMap(c => c.pokemonIds);
  assert.equal(new Set(route).size, route.length);
  assert.equal(route[0], 25);
  assert.ok(route.indexOf(10) < route.indexOf(1));
  assert.ok(route.indexOf(1) < route.indexOf(4));
  assert.ok(route.indexOf(4) < route.indexOf(7));
  const owned = [4, 7, 133];
  const earned: number[] = [];
  while (capturePool(snapshotWith([...owned, ...earned])).length) {
    const next = capturePool(snapshotWith([...owned, ...earned]));
    assert.equal(next.length, 1); assert.equal(next[0].evolvesFrom, null);
    earned.push(next[0].id);
  }
  assert.deepEqual(earned.slice(0, route.length - 3), route.filter(id => !owned.includes(id)));
  assert.equal(new Set([...owned, ...earned]).size, pokemon.filter(p => p.category === 'story' || p.category === 'exploration').length);
});

test('Pidgey uses Flying as its initial example and multiplies Normal/Flying defense correctly', () => {
  const types = pokemonById.get(16)!.types;
  assert.deepEqual(types, ['normal', 'flying']);
  assert.equal(defaultExampleType(types), 'flying');
  assert.equal(defaultExampleType(['normal']), 'normal');
  assert.deepEqual(strengths(['normal']), []);
  assert.deepEqual(new Set(strengths(['flying'])), new Set(['grass', 'bug', 'fighting']));
  assert.deepEqual(new Set(weaknesses(types).map(item => `${item.type}:${item.multiplier}`)), new Set(['electric:2', 'ice:2', 'rock:2']));
  assert.equal(effectiveness('fighting', types), 1);
  assert.deepEqual(new Set(resistances(types).map(item => `${item.type}:${item.multiplier}`)), new Set(['grass:0.5', 'bug:0.5', 'ground:0', 'ghost:0']));
  // A super-effective move against one type can be neutral against a dual-type partner.
  assert.equal(effectiveness('flying', pokemonById.get(74)!.types), 0.5);
  assert.equal(effectiveness('flying', pokemonById.get(1)!.types), 2);
});
