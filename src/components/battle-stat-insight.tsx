'use client';

import { ArrowRight, Gauge, Swords } from 'lucide-react';
import type { BattleMove } from '@/domain/battle-loadout';
import { battleStatPair, type BattleInsight } from '@/domain/battle';
import { statLabels, pokemonById } from '@/domain/pokemon';
import { multiplierLabel } from '@/domain/type-encyclopedia';
import { useLocale, useT } from '@/lib/i18n/locale';
import styles from './battle-stat-insight.module.css';

function StatPairLine({ category, attacker, target }: { category: BattleMove['category']; attacker: number; target: number }) {
  const localize = useT();
  const english = useLocale() === 'en';
  const pair = battleStatPair(category, attacker, target);
  return <div className={styles.pair}>
    <span className={styles.category}>{english ? category === 'physical' ? 'Physical' : 'Special' : category === 'physical' ? '物理招式' : '特殊招式'}</span>
    <span>{localize(statLabels[pair.offense])} <b>{localize(pair.offenseValue)}</b></span>
    <ArrowRight size={15} aria-hidden="true" />
    <span>{localize(statLabels[pair.guard])} <b>{localize(pair.guardValue)}</b></span>
  </div>;
}

function speedLine(player: number, enemy: number, first: 'player' | 'enemy' | undefined, english: boolean, localize: ReturnType<typeof useT>) {
  const partner = pokemonById.get(player)!;
  const opponent = pokemonById.get(enemy)!;
  const ours = partner.stats.speed;
  const theirs = opponent.stats.speed;
  const name = localize(partner.name);
  const opponentName = localize(opponent.name);
  if (ours === theirs) {
    if (!first) return english
      ? `${name} and ${opponentName} both have ${ours} Speed. The first turn will be decided when you enter.`
      : `${name}和${opponentName}的速度都是 ${ours}，上场时决定谁先出招。`;
    const firstName = first === 'player' ? name : opponentName;
    return english
      ? `Both have ${ours} Speed. ${firstName} moves first this match.`
      : `双方速度都是 ${ours}，这场由${firstName}先出招。`;
  }
  const firstName = ours > theirs ? name : opponentName;
  return english
    ? `${name} ${ours} · ${opponentName} ${theirs}. ${firstName} has more Speed and moves first.`
    : `${name} ${ours} · ${opponentName} ${theirs}。${firstName}速度更高，先出招。`;
}

export function BattleStatPreview({ player, enemy }: { player: number; enemy: number }) {
  const localize = useT();
  const english = useLocale() === 'en';
  return <section className={styles.preview} aria-label={english ? 'Before the battle' : '上场前看能力'}>
    <h3><Gauge size={18} aria-hidden="true" />{english ? 'Before the battle' : '上场前看能力'}</h3>
    <p className={styles.speed}>{speedLine(player, enemy, undefined, english, localize)}</p>
    <div className={styles.pairs}><StatPairLine category="physical" attacker={player} target={enemy} /><StatPairLine category="special" attacker={player} target={enemy} /></div>
    <small>{english ? 'A move uses one of these stat pairs. Its type also changes the damage.' : '招式会使用其中一组能力；属性克制也会改变伤害。'}</small>
  </section>;
}

export function BattleHitInsight({ insight, player }: { insight: BattleInsight; player: number }) {
  const localize = useT();
  const english = useLocale() === 'en';
  const pair = battleStatPair(insight.move.category, insight.attacker, insight.target);
  const actor = localize(pokemonById.get(insight.attacker)!.name);
  const target = localize(pokemonById.get(insight.target)!.name);
  const category = english ? insight.move.category === 'physical' ? 'physical' : 'special' : insight.move.category === 'physical' ? '物理' : '特殊';
  return <section className={styles.hit} aria-label={english ? 'Last move explained' : '上一招为什么这样扣血'}>
    <span className={styles.hitLabel}><Swords size={16} aria-hidden="true" />{insight.attacker === player ? english ? 'Your last move' : '我们的上一招' : english ? 'Opponent’s last move' : '对手的上一招'}</span>
    <p><b>{localize(insight.move.name)}</b><span>{english ? `${category} move` : `${category}招式`}</span><span>{actor} {localize(statLabels[pair.offense])} <strong>{localize(pair.offenseValue)}</strong> <ArrowRight size={14} aria-hidden="true" /> {target} {localize(statLabels[pair.guard])} <strong>{localize(pair.guardValue)}</strong></span></p>
    <small>{insight.move.fallback ? english ? 'No type matchup' : '不计算属性克制' : `${english ? 'Type' : '属性'} ×${localize(multiplierLabel(insight.multiplier))}`} · {english ? `HP −${insight.lost}` : `体力 −${insight.lost}`}</small>
  </section>;
}

export function BattleRecapStats({ player, enemy, first, move, target }: { player: number; enemy: number; first?: 'player' | 'enemy'; move: BattleMove; target: number }) {
  const localize = useT();
  const english = useLocale() === 'en';
  return <div className={styles.recap}>
    <p><Gauge size={17} aria-hidden="true" />{speedLine(player, enemy, first, english, localize)}</p>
    <StatPairLine category={move.category} attacker={player} target={target} />
    <small>{english ? 'These stats and the type matchup together shape the damage.' : '这两项种族值和属性效果一起影响伤害。'}</small>
  </div>;
}
