'use client';
import { useState } from 'react';
import { ArrowRight, Shield, Sparkles, ChevronDown, Zap, Swords, ShieldAlert, Check } from 'lucide-react';
import type { Pokemon, PokemonType } from '@/domain/types';
import { TYPE_NAMES } from '@/domain/types';
import { defaultExampleType, effectiveness, resistances, strengths, weaknesses } from '@/domain/effectiveness';
import { pokemon } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';
import { TypeBadge, TypePicture } from './type-badge';

function StrongHit({ multiplier }: { multiplier: number }) {
  return <span className="strong-hit" aria-label={`招式效果为 ${multiplier} 倍`}><ArrowRight aria-hidden="true" size={28} /><span className="hit-sparks" aria-hidden="true">{Array.from({ length: multiplier }, (_, i) => <Zap key={i} size={15} fill="currentColor" />)}</span><b>×{multiplier}</b></span>;
}

export function TypeDiscovery({ partner, discovered }: { partner: Pokemon; discovered: Set<number> }) {
  const [choice, setChoice] = useState<PokemonType>(() => defaultExampleType(partner.types));
  const attack = partner.types.includes(choice) ? choice : defaultExampleType(partner.types);
  const targets = strengths([attack]);
  const incoming = weaknesses(partner.types);
  const combinedExample = partner.types.length > 1 ? (Object.keys(TYPE_NAMES) as PokemonType[]).find(type =>
    effectiveness(type, partner.types) === 1 && partner.types.some(defense => effectiveness(type, [defense]) > 1)
  ) ?? incoming[0]?.type : undefined;
  const examples = pokemon.filter(p => p.id !== partner.id && discovered.has(p.id) && effectiveness(attack, p.types) > 1).slice(0, 3);
  return <section className="detail-panel type-discovery"><div className="section-heading"><h2><Sparkles size={23} /> 看图认识属性</h2></div>
    <div className="type-lessons"><section className="type-lesson outgoing"><h3><Swords size={25} aria-hidden="true" /> 我出招！</h3>
      <div className="lesson-context"><div className="lesson-avatar"><PokemonArt pokemon={partner} /><strong>{partner.name}</strong></div><div className="move-controls"><span className="lesson-label">这次用的招式</span><div className="move-picker" role="group" aria-label="选择出招属性，不改变伙伴自身属性">{partner.types.length === 1 ? <TypePicture type={attack} /> : partner.types.map(type => <button key={type} type="button" aria-pressed={attack === type} aria-label={`看看${TYPE_NAMES[type]}属性招式`} onClick={() => setChoice(type)}><TypePicture type={type} />{attack === type && <Check className="move-selected" size={16} aria-hidden="true" />}</button>)}</div>{partner.types.length > 1 && <small className="move-hint">点一点，换招式</small>}</div></div>
      <div className="lesson-result" aria-live="polite"><span className="lesson-label">{TYPE_NAMES[attack]}招式 → 这些属性</span>{targets.length ? <div className="compact-effect-row"><div className="attack-targets">{targets.map(type => <TypePicture key={type} type={type} />)}</div><StrongHit multiplier={2} /></div> : <div className="neutral-effect"><Shield size={28} aria-hidden="true" /><div><strong>没有效果加倍的属性</strong><p>一般招式也能攻击，只是没有属性克制优势。</p></div></div>}</div>
    </section>
    <section className="type-lesson incoming"><h3><ShieldAlert size={25} aria-hidden="true" /> 小心这招！</h3>
      <div className="lesson-context"><div className="lesson-avatar"><PokemonArt pokemon={partner} /><strong>{partner.name}</strong></div><div className="fixed-typing"><span className="lesson-label">自身属性{partner.types.length > 1 ? ' · 一起算' : ''}</span><div className="defender-types" aria-label={`${partner.name}的完整属性：${partner.types.map(type => TYPE_NAMES[type]).join('和')}`}>{partner.types.map((type, index) => <span key={type}>{index > 0 && <b aria-hidden="true">＋</b>}<TypeBadge type={type} /></span>)}</div><small className="move-hint">换招式不会改变自身属性</small></div></div>
      <div className="lesson-result"><span className="lesson-label">这些招式 → {partner.name}</span><div className="incoming-groups">{[4, 2].map(multiplier => {
        const group = incoming.filter(item => item.multiplier === multiplier);
        return group.length ? <div className="compact-effect-row" key={multiplier}><div className="incoming-types">{group.map(({ type }) => <TypePicture key={type} type={type} />)}</div><StrongHit multiplier={multiplier} /></div> : null;
      })}</div>{!incoming.length && <div className="neutral-effect"><Shield size={28} aria-hidden="true" /><strong>没有效果加倍的来袭招式</strong></div>}</div>
    </section></div>
    {examples.length > 0 && <details className="matchup-examples"><summary>看看认识的伙伴 <ChevronDown size={18} /></summary><div className="familiar-examples"><h4>{TYPE_NAMES[attack]}招式打向它们时</h4><div>{examples.map(p => <div className="familiar-example" key={p.id}><PokemonArt pokemon={p} /><span>{p.name}</span><b>×{effectiveness(attack, p.types)}</b></div>)}</div></div></details>}
    <details className="resistance-details type-grownup-notes"><summary><Shield size={19} /> 陪看说明<ChevronDown size={16} /></summary><p className="lesson-note">采用第六世代起的通常属性相克表，与图鉴展示的现行属性一致；不采用第一世代旧表。出招时只看当前选中的招式属性，受到招式时将伙伴的所有属性倍率相乘。</p><p className="lesson-note">左侧比较所选招式对单一属性的效果，右侧比较来袭招式对伙伴完整属性的效果。闪电越多，属性效果越强；右侧倍率会一起计算伙伴的所有属性。</p>{combinedExample && <div className="combined-example"><h4>两种属性，怎么算？</h4><div className="combined-equation"><TypeBadge type={combinedExample} /><ArrowRight size={19} aria-hidden="true" />{partner.types.map((type, index) => <span className="equation-factor" key={type}>{index > 0 && <b>×</b>}<span><TypeBadge type={type} /><strong>{effectiveness(combinedExample, [type])}</strong></span></span>)}<b>＝ {effectiveness(combinedExample, partner.types)} 倍</b></div><p className="lesson-note">{TYPE_NAMES[combinedExample]}招式打向{partner.name}：{partner.types.map(type => `对${TYPE_NAMES[type]}是 ${effectiveness(combinedExample, [type])} 倍`).join('，')}，合起来是 {effectiveness(combinedExample, partner.types)} 倍。</p></div>}<p className="lesson-note">以下属性的招式对伙伴效果较小：</p><div className="badge-list">{resistances(partner.types).map(({ type, multiplier }) => <TypeBadge key={type} type={type} multiplier={multiplier} />)}</div><p className="lesson-note">这是招式属性的比较，不代表某只宝可梦一定能赢。×2 / ×4 为属性效果倍率；×0 为无效，不计算特性、等级或其他招式效果。</p></details>
  </section>;
}
