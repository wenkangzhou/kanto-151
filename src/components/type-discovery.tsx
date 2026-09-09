'use client';
import { useState } from 'react';
import { ArrowRight, Shield, Sparkles, ChevronDown, Zap, Swords, ShieldAlert, Check } from 'lucide-react';
import type { Pokemon, PokemonType } from '@/domain/types';
import { TYPE_NAMES } from '@/domain/types';
import { effectiveness, resistances, strengths, weaknesses } from '@/domain/effectiveness';
import { pokemon } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';
import { TypeBadge, TypePicture } from './type-badge';

function StrongHit({ multiplier }: { multiplier: number }) {
  return <span className="strong-hit" aria-label={`招式效果为 ${multiplier} 倍`}><ArrowRight aria-hidden="true" size={28} /><span className="hit-sparks" aria-hidden="true">{Array.from({ length: multiplier }, (_, i) => <Zap key={i} size={15} fill="currentColor" />)}</span><b>×{multiplier}</b></span>;
}

export function TypeDiscovery({ partner, discovered }: { partner: Pokemon; discovered: Set<number> }) {
  const [choice, setChoice] = useState<PokemonType>(partner.types[0]);
  const attack = partner.types.includes(choice) ? choice : partner.types[0];
  const targets = strengths([attack]);
  const incoming = weaknesses(partner.types);
  const examples = pokemon.filter(p => p.id !== partner.id && discovered.has(p.id) && effectiveness(attack, p.types) > 1).slice(0, 3);
  return <section className="detail-panel type-discovery"><div className="section-heading"><h2><Sparkles size={23} /> 看图认识属性</h2></div>
    <div className="type-lessons"><section className="type-lesson outgoing"><h3><Swords size={25} aria-hidden="true" /> 我出招！</h3>
      <div className="attack-scene" aria-label={`${partner.name}使用${TYPE_NAMES[attack]}属性招式，对右侧单一属性效果加倍`}>
        <div className="lesson-partner"><PokemonArt pokemon={partner} /><span>{partner.name}</span>
          <div className="move-picker" role="group" aria-label="示例招式属性">{partner.types.length === 1 ? <TypePicture type={attack} /> : partner.types.map(type => <button key={type} type="button" aria-pressed={attack === type} aria-label={`看看${TYPE_NAMES[type]}属性招式`} onClick={() => setChoice(type)}><TypePicture type={type} />{attack === type && <Check className="move-selected" size={16} aria-hidden="true" />}</button>)}</div>
          {partner.types.length > 1 && <small className="move-hint">点一点，换招式</small>}
        </div>
        {targets.length > 0 && <><StrongHit multiplier={2} /><div className="attack-targets" aria-live="polite">{targets.map(type => <TypePicture key={type} type={type} />)}</div></>}
      </div>
      {!targets.length && <p className="lesson-note">这种招式没有效果加倍的单一属性。</p>}
      {examples.length > 0 && <div className="familiar-examples"><h4>试试看</h4><div>{examples.map(p => <div className="familiar-example" key={p.id}><PokemonArt pokemon={p} /><span>{p.name}</span><b>×{effectiveness(attack, p.types)}</b></div>)}</div></div>}
    </section>
    <section className="type-lesson incoming"><h3><ShieldAlert size={25} aria-hidden="true" /> 小心这招！</h3><div className="incoming-groups">{[4, 2].map(multiplier => {
      const group = incoming.filter(item => item.multiplier === multiplier);
      return group.length ? <div className="incoming-row" key={multiplier}><div className="incoming-types">{group.map(({ type }) => <TypePicture key={type} type={type} />)}</div><StrongHit multiplier={multiplier} /><div className="lesson-partner"><div className="hit-partner"><PokemonArt pokemon={partner} /><span className="hit-alert" aria-label="效果加倍">!</span></div><span>{partner.name}</span></div></div> : null;
    })}</div>{!incoming.length && <p className="lesson-note">没有效果加倍的属性招式。</p>}
    </section></div>
    <details className="resistance-details type-grownup-notes"><summary><Shield size={19} /> 陪看说明<ChevronDown size={16} /></summary><p className="lesson-note">箭头表示出招方向，闪电越多，属性效果越强。左边是伙伴使用所选属性的招式，右边是这些招式打向伙伴。彩色标签表示单一属性，伙伴图片旁的倍率会一起计算它的两种属性。</p><p className="lesson-note">以下属性的招式对伙伴效果较小：</p><div className="badge-list">{resistances(partner.types).map(({ type, multiplier }) => <TypeBadge key={type} type={type} multiplier={multiplier} />)}</div><p className="lesson-note">这是招式属性的比较，不代表某只宝可梦一定能赢。×2 / ×4 为属性效果倍率；×0 为无效，不计算特性、等级或其他招式效果。</p></details>
  </section>;
}
