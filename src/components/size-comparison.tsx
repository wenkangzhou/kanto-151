'use client';
import type { Pokemon } from '@/domain/types';
import bounds from '@/data/artwork-bounds.json';
import { ASH_HEIGHT, COMPARISON_WIDTH, COMPARISON_BASELINE, comparisonLayout, lengthComparisonIds } from '@/domain/size-comparison';

export function SizeComparison({ pokemon }: { pokemon: Pokemon }) {
  const [, , width, height] = (bounds as Record<string, number[]>)[pokemon.id] ?? [0, 0, 475, 475, 475, 475];
  const length = lengthComparisonIds.has(pokemon.id);
  const layout = comparisonLayout(pokemon.height, width / height, length);
  const baseline = COMPARISON_BASELINE;
  const trainerX = COMPARISON_WIDTH - layout.left - layout.ashWidth;
  const partnerX = COMPARISON_WIDTH - layout.partnerX - layout.partnerWidth;
  const description = length
    ? `身体伸展长度${pokemon.height}米，人物参照约${ASH_HEIGHT}米。剪影最长方向按体长示意，不表示盘曲时的站立高度。`
    : `${pokemon.name}高${pokemon.height}米，人物参照约${ASH_HEIGHT}米，两者按同一比例展示。`;
  return <section className="size-comparison" aria-label="大小对比">
    <div className="size-comparison-mini">
      <span className="size-comparison-caption">大小{length ? ' · 体长示意' : ''}</span>
      <div className="size-comparison-canvas" role="img" aria-label={description}>
        <span className="size-comparison-ground" />
        {/* Pre-baked PNGs avoid dynamic SVG filter repainting on iPad. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/silhouettes/trainer.png" alt="" width={40} height={55} draggable={false} style={{ left: `${trainerX / 240 * 100}%`, top: `${(baseline - layout.ashHeight) / 140 * 100}%`, width: `${layout.ashWidth / 240 * 100}%`, height: `${layout.ashHeight / 140 * 100}%`, imageRendering: 'pixelated' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={pokemon.id} src={`/illustrations/silhouettes/${pokemon.id}.png`} alt="" width={width} height={height} draggable={false} style={{ left: `${partnerX / 240 * 100}%`, top: `${(baseline - layout.partnerHeight) / 140 * 100}%`, width: `${layout.partnerWidth / 240 * 100}%`, height: `${layout.partnerHeight / 140 * 100}%` }} />
      </div>
    </div>
    <dl className="size-comparison-numbers"><div><dt>{length ? '长度' : '身高'}</dt><dd>{pokemon.height} 米</dd></div><div><dt>体重</dt><dd>{pokemon.weight} 千克</dd></div><div className="size-comparison-reference"><dt>人物参照</dt><dd>约 1.4 米</dd></div></dl>
  </section>;
}
