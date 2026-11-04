import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { johtoFromKanto, johtoPokemon, johtoRegional } from '@/domain/johto';
import { pokemonById } from '@/domain/pokemon';
import { TYPE_NAMES } from '@/domain/types';
import bounds from '@/data/artwork-bounds.json';

test('the unlisted Johto preview has exactly 100 locally illustrated national entries', () => {
  assert.deepEqual(johtoPokemon.map(pokemon => pokemon.id), Array.from({ length: 100 }, (_, index) => index + 152));
  for (const pokemon of johtoPokemon) {
    assert.ok(pokemon.name && pokemon.traditionalName && pokemon.englishName && pokemon.genus && pokemon.description);
    assert.ok(pokemon.englishDescription.length >= 20);
    assert.ok(pokemon.types.length > 0 && pokemon.types.every(type => type in TYPE_NAMES));
    assert.equal(Object.keys(pokemon.stats).length, 6);
    assert.ok(Object.values(pokemon.stats).every(value => Number.isInteger(value) && value > 0));
    assert.ok(statSync(`public${pokemon.artwork}`).size > 0);
    assert.ok(statSync(`public/illustrations/silhouettes/${pokemon.id}.png`).size > 0);
    assert.ok((bounds as Record<string, number[]>)[pokemon.id]?.[2] > 0);
    assert.equal(pokemon.artwork, `/johto/pokemon/${pokemon.id}.png`);
    if (pokemon.evolvesFrom !== null) assert.ok(pokemon.evolvesFrom < pokemon.id);
  }
});

test('Johto English descriptions are distinct and readable', () => {
  assert.equal(new Set(johtoPokemon.map(pokemon => pokemon.englishDescription)).size, johtoPokemon.length);
  assert.ok(johtoPokemon.every(pokemon => !/[\n\f\u00ad]/.test(pokemon.englishDescription)));
});

test('Johto cross-region evolution links point to existing Kanto species', () => {
  assert.equal(johtoFromKanto.length, 11);
  for (const pokemon of johtoFromKanto) assert.ok(pokemonById.has(pokemon.evolvesFrom!));
});

test('the original Johto regional order reuses all Kanto species and adds 100 new ones', () => {
  assert.equal(johtoRegional.length, 251);
  assert.deepEqual(johtoRegional.map(pokemon => pokemon.regionalNumber), Array.from({ length: 251 }, (_, index) => index + 1));
  assert.deepEqual(johtoRegional.map(pokemon => pokemon.id).toSorted((a, b) => a - b), Array.from({ length: 251 }, (_, index) => index + 1));
  assert.equal(johtoRegional.filter(pokemon => pokemon.newInJohto).length, 100);
  assert.equal(johtoRegional.filter(pokemon => !pokemon.newInJohto).length, 151);
  assert.equal(johtoRegional[0].id, 152);
  assert.equal(johtoRegional.at(-1)?.id, 251);
  for (const pokemon of johtoRegional.filter(entry => !entry.newInJohto)) assert.equal(pokemonById.get(pokemon.id)?.artwork, pokemon.artwork);
});
