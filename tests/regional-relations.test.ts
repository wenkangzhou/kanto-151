import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evolutionNeighbors, regionAppearances, regionHref, regionalDetailRelations, relatedSpeciesHref } from '@/domain/regional-relations';

test('shared national species keep separate regional positions', () => {
  assert.deepEqual(regionAppearances(25), [
    { region: 'kanto', number: 25 },
    { region: 'johto', number: 22 },
    { region: 'hoenn', number: 156 },
  ]);
  assert.deepEqual(regionAppearances(212), [{ region: 'johto', number: 111 }]);
  assert.deepEqual(regionAppearances(298), [{ region: 'hoenn', number: 54 }]);
});

test('cross-generation babies and branching evolutions navigate in both directions', () => {
  assert.deepEqual(evolutionNeighbors(25).before.map(pokemon => pokemon.id), [172]);
  assert.deepEqual(evolutionNeighbors(172).after.map(pokemon => pokemon.id), [25]);
  assert.deepEqual(evolutionNeighbors(236).after.map(pokemon => pokemon.id), [106, 107, 237]);
  assert.deepEqual(evolutionNeighbors(183).before.map(pokemon => pokemon.id), [298]);
  assert.deepEqual(evolutionNeighbors(202).before.map(pokemon => pokemon.id), [360]);
  assert.deepEqual(evolutionNeighbors(123).after.map(pokemon => pokemon.id), [212]);
  assert.equal(regionHref(25, 'kanto'), '/pokemon/25');
  assert.equal(regionHref(25, 'johto'), '/johto/pokedex/25');
  assert.equal(regionHref(25, 'hoenn'), '/hoenn/pokedex/25');
  assert.equal(relatedSpeciesHref(212, 'hoenn'), '/johto/pokedex/212');
  assert.equal(relatedSpeciesHref(298, 'johto'), '/hoenn/pokedex/298');
  const detail = regionalDetailRelations(25, 'johto');
  assert.deepEqual(detail.appearances.map(appearance => appearance.href), ['/pokemon/25', '/johto/pokedex/25', '/hoenn/pokedex/25']);
  assert.equal(detail.evolution.before[0].href, '/johto/pokedex/172');
  assert.deepEqual(detail.family.map(member => member.id), [172, 25, 26]);
  assert.deepEqual(regionalDetailRelations(265, 'hoenn').family.map(member => member.id), [265, 266, 267, 268, 269]);
  assert.ok(detail.examplePool.length > 0);
});
