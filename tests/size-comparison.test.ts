import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pokemon from '../src/data/pokemon.json';
import bounds from '../src/data/artwork-bounds.json';
import { ASH_HEIGHT, comparisonLayout, lengthComparisonIds } from '../src/domain/size-comparison';

function layoutFor(id: number) {
  const p = pokemon.find(p => p.id === id)!;
  const [, , w, h] = (bounds as Record<string, number[]>)[id];
  return comparisonLayout(p.height, w / h, lengthComparisonIds.has(id));
}

test('all 151 rendered silhouettes use the shared scale and remain within bounds', () => {
  for (const p of pokemon) {
    const [x, y, w, h, iw, ih] = (bounds as Record<string, number[]>)[p.id];
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= iw && y + h <= ih);
    const layout = layoutFor(p.id);
    const measured = lengthComparisonIds.has(p.id) ? Math.max(layout.partnerHeight, layout.partnerWidth) : layout.partnerHeight;
    assert.ok(Math.abs(measured / layout.ashHeight - p.height / ASH_HEIGHT) < 1e-9);
    assert.ok(layout.ashHeight <= 126 + 1e-9 && layout.partnerHeight <= 126 + 1e-9);
    assert.ok(layout.left >= 0 && layout.partnerX + layout.partnerWidth <= 240);
  }
});

test('equal-sized early partners look equally tall and smaller than Charmander', () => {
  const caterpie = layoutFor(10), weedle = layoutFor(13), pidgey = layoutFor(16), rattata = layoutFor(19), charmander = layoutFor(4);
  for (const small of [caterpie, weedle, pidgey, rattata]) {
    assert.equal(small.partnerHeight, caterpie.partnerHeight);
    assert.equal(small.ashHeight, caterpie.ashHeight);
    assert.equal(small.partnerHeight * 2, charmander.partnerHeight);
    // At the narrowest 164px viewport, a 0.3m partner stays at least 18px tall.
    assert.ok(small.partnerHeight * 164 / 240 >= 18);
  }
});

test('20-metre and unusually wide partners scale down together', () => {
  for (const [height, aspect] of [[20, 1], [2, 10]]) {
    const layout = comparisonLayout(height, aspect);
    assert.ok(layout.partnerX + layout.partnerWidth <= 240);
    assert.ok(layout.partnerHeight <= 126 + 1e-9);
    assert.ok(Math.abs(layout.partnerHeight / layout.ashHeight - height / ASH_HEIGHT) < 1e-9);
  }
});

test('every comparison has a cropped PNG matching the dimensions used for scaling', () => {
  for (const p of pokemon) {
    const image = readFileSync(new URL(`../public/illustrations/silhouettes/${p.id}.png`, import.meta.url));
    const [, , width, height] = (bounds as Record<string, number[]>)[p.id];
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.equal(image.readUInt32BE(16), width);
    assert.equal(image.readUInt32BE(20), height);
    assert.equal(image[25], 6, 'RGBA preserves silhouette transparency');
  }
  const trainer = readFileSync(new URL('../public/illustrations/silhouettes/trainer.png', import.meta.url));
  assert.equal(trainer.readUInt32BE(16), 40);
  assert.equal(trainer.readUInt32BE(20), 55);
});
