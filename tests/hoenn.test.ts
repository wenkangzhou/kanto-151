import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { hoennPokemon, hoennRegional } from '@/domain/hoenn';
import { johtoPokemon } from '@/domain/johto';
import { pokemonById } from '@/domain/pokemon';
import { TYPE_NAMES } from '@/domain/types';

test('the unlisted Hoenn preview has 135 locally illustrated new species', () => {
  assert.deepEqual(hoennPokemon.map(pokemon => pokemon.id), Array.from({ length: 135 }, (_, index) => index + 252));
  for (const pokemon of hoennPokemon) {
    assert.ok(pokemon.name && pokemon.traditionalName && pokemon.englishName && pokemon.genus);
    assert.ok(pokemon.description.length >= 20);
    assert.ok(pokemon.types.length > 0 && pokemon.types.every(type => type in TYPE_NAMES));
    assert.equal(pokemon.artwork, `/hoenn/pokemon/${pokemon.id}.png`);
    assert.ok(statSync(`public${pokemon.artwork}`).size > 0);
    if (pokemon.evolvesFrom !== null) assert.ok(pokemon.evolvesFrom < pokemon.id);
  }
});

test('the original Hoenn regional order reuses existing Kanto and Johto records', () => {
  assert.equal(hoennRegional.length, 202);
  assert.deepEqual(hoennRegional.map(pokemon => pokemon.regionalNumber), Array.from({ length: 202 }, (_, index) => index + 1));
  assert.equal(new Set(hoennRegional.map(pokemon => pokemon.id)).size, 202);
  assert.equal(hoennRegional.filter(pokemon => pokemon.id <= 151).length, 47);
  assert.equal(hoennRegional.filter(pokemon => pokemon.id >= 152 && pokemon.id <= 251).length, 20);
  assert.equal(hoennRegional.filter(pokemon => pokemon.newInHoenn).length, 135);
  assert.equal(hoennRegional[0].id, 252);
  assert.equal(hoennRegional.at(-1)?.id, 386);
  const johtoById = new Map(johtoPokemon.map(pokemon => [pokemon.id, pokemon]));
  for (const entry of hoennRegional) {
    if (entry.id <= 151) assert.equal(entry.artwork, pokemonById.get(entry.id)?.artwork);
    else if (entry.id <= 251) assert.equal(entry.artwork, johtoById.get(entry.id)?.artwork);
  }
});
