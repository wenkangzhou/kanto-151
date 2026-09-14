'use client';
import { useId } from 'react';
import type { Pokemon } from '@/domain/types';
import bounds from '@/data/artwork-bounds.json';
import { ASH_HEIGHT, COMPARISON_WIDTH, COMPARISON_BASELINE, comparisonLayout, lengthComparisonIds } from '@/domain/size-comparison';

export function SizeComparison({ pokemon }: { pokemon: Pokemon }) {
  const filter = useId();
  const [x, y, width, height, imageWidth, imageHeight] = (bounds as Record<string, number[]>)[pokemon.id] ?? [0, 0, 475, 475, 475, 475];
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
      <svg viewBox="0 0 240 140" role="img" aria-label={description}>
        <defs><filter id={filter} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .32 0 0 0 0 .32 0 0 0 0 .32 0 0 0 1 0" /></filter></defs>
        <path d="M6 132H234" stroke="#c9d3c7" strokeWidth="1" />
        <svg x={trainerX} y={baseline - layout.ashHeight} width={layout.ashWidth} height={layout.ashHeight} viewBox="10 8 40 55">
          <image href="/illustrations/trainer-red.png" width="64" height="64" filter={`url(#${filter})`} style={{ imageRendering: 'pixelated' }} />
        </svg>
        <svg x={partnerX} y={baseline - layout.partnerHeight} width={layout.partnerWidth} height={layout.partnerHeight} viewBox={`${x} ${y} ${width} ${height}`}>
          <image href={pokemon.artwork} width={imageWidth} height={imageHeight} filter={`url(#${filter})`} />
        </svg>
      </svg>
    </div>
    <dl className="size-comparison-numbers"><div><dt>{length ? '长度' : '身高'}</dt><dd>{pokemon.height} 米</dd></div><div><dt>体重</dt><dd>{pokemon.weight} 千克</dd></div><div className="size-comparison-reference"><dt>人物参照</dt><dd>约 1.4 米</dd></div></dl>
  </section>;
}
