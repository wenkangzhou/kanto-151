'use client';

import type { CSSProperties, ReactNode } from 'react';
import { ChartNoAxesColumnIncreasing } from 'lucide-react';
import type { Stats } from '@/domain/types';
import { statLabels } from '@/domain/pokemon';
import { useLocale, useT } from '@/lib/i18n/locale';
import styles from './base-stats-panel.module.css';

const keys = Object.keys(statLabels) as (keyof Stats)[];
const colors = ['#81a879', '#d39784', '#c8ac69', '#8ba9c8', '#a995bc', '#7fae9f'];
const center = 170;
const radius = 108;

function point(index: number, distance: number) {
  const angle = (index * 60 - 90) * Math.PI / 180;
  return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance] as const;
}

function polygon(distances: number[]) {
  return distances.map((distance, index) => point(index, distance).map(value => value.toFixed(1)).join(',')).join(' ');
}

export function BaseStatsPanel({ stats, children }: { stats: Stats; children?: ReactNode }) {
  const localize = useT();
  const english = useLocale() === 'en';
  const values = keys.map(key => stats[key]);
  const strongest = Math.max(...values);
  const scale = Math.max(1, strongest);
  const strongestNames = keys.filter(key => stats[key] === strongest).map(key => statLabels[key]);
  const summary = `六项种族值中，${strongestNames.join('、')}最高（${strongest}）。`;
  const total = values.reduce((sum, value) => sum + value, 0);

  return <section className={`detail-panel ${styles.panel}`} aria-label={localize('种族值')}>
    <header className={styles.header}>
      <div><span className={styles.kicker}>{english ? 'PARTNER PROFILE' : '伙伴能力档案'}</span><h2><ChartNoAxesColumnIncreasing size={21} aria-hidden="true" />{localize('种族值')}</h2></div>
      <span className={styles.total}>{localize('合计')}<b className="mono">{localize(total)}</b></span>
    </header>
    <p className={styles.summary}>{localize(summary)}</p>
    <div className={styles.content}>
      <figure className={styles.chart}>
        <svg viewBox="0 0 340 340" aria-hidden="true" focusable="false">
          {[.25, .5, .75, 1].map(level => <polygon key={level} points={polygon(keys.map(() => radius * level))} className={styles.grid} />)}
          {keys.map((key, index) => {
            const [x, y] = point(index, radius);
            const [labelX, labelY] = point(index, 133);
            return <g key={key}>
              <line x1={center} y1={center} x2={x} y2={y} className={styles.axis} />
              <text x={labelX} y={labelY} textAnchor={labelX < center - 8 ? 'end' : labelX > center + 8 ? 'start' : 'middle'} dominantBaseline="middle" className={styles.axisLabel}>{localize(statLabels[key])}</text>
            </g>;
          })}
          <polygon points={polygon(values.map(value => radius * value / scale))} className={styles.shape} />
          {values.map((value, index) => {
            const [x, y] = point(index, radius * value / scale);
            return <circle key={keys[index]} cx={x} cy={y} r="5" fill={colors[index]} className={styles.vertex} />;
          })}
        </svg>
        <figcaption>{english ? 'The outline compares this partner’s six abilities.' : '轮廓展示这位伙伴六项能力的相对强弱'}</figcaption>
      </figure>
      <ol className={styles.values} aria-label={localize('种族值')}>
        {keys.map((key, index) => <li key={key} className={stats[key] === strongest ? styles.strongest : ''} style={{ '--stat-color': colors[index] } as CSSProperties}>
          <span className={styles.name}><i aria-hidden="true" />{localize(statLabels[key])}</span>
          <b className="mono">{localize(stats[key])}</b>
        </li>)}
      </ol>
    </div>
    <p className={styles.footnote}>{english ? 'The outer edge marks this partner’s highest stat. Use the numbers to compare different Pokémon. Base stats describe traits, not growth scores.' : '外圈代表这位伙伴最高的一项；比较不同宝可梦时请看数字。种族值展示特点，不是成长分数。'}</p>
    {children}
  </section>;
}
