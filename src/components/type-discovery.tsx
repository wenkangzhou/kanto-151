'use client';
import { useState } from 'react';
import { ArrowRight, Shield, Sparkles, ChevronDown } from 'lucide-react';
import type { Pokemon, PokemonType } from '@/domain/types';
import { TYPE_NAMES } from '@/domain/types';
import { effectiveness, resistances, strengths, weaknesses } from '@/domain/effectiveness';
import { pokemon } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';
import { TypeBadge, TypePicture } from './type-badge';

export function TypeDiscovery({ partner, discovered }: { partner: Pokemon; discovered: Set<number> }) {
  const [choice, setChoice] = useState<PokemonType>(partner.types[0]);
  const attack = partner.types.includes(choice) ? choice : partner.types[0];
  const targets = strengths([attack]);
  const incoming = weaknesses(partner.types);
  const examples = pokemon.filter(p => p.id !== partner.id && discovered.has(p.id) && effectiveness(attack, p.types) > 1).slice(0, 3);
  return <section className="detail-panel type-discovery"><div className="section-heading"><h2><Sparkles size={23} /> 看图认识属性</h2></div>
    <div className="type-lessons"><section className="type-lesson outgoing"><h3>伙伴出招！</h3><div className="type-flow"><div className="lesson-partner"><PokemonArt pokemon={partner} /><span>{partner.name}</span></div><ArrowRight aria-hidden="true" /><div className="move-picker" role="group" aria-label="选择示例招式的属性">{partner.types.map(type => <button key={type} type="button" aria-pressed={attack === type} aria-label={`看看${TYPE_NAMES[type]}属性招式`} onClick={() => setChoice(type)}><TypePicture type={type} /></button>)}<small>{partner.types.length > 1 ? '点一点，换种招式' : '属性招式'}</small></div></div>
    <div className="lesson-targets" aria-live="polite"><div className="lesson-caption"><ArrowRight size={20} aria-hidden="true" /><strong>碰到这些属性，力量更大</strong><span className="power-result">×2</span></div><div className="type-picture-grid">{targets.map(type => <TypePicture key={type} type={type} />)}</div>{!targets.length && <p className="lesson-note">这种属性没有特别占优势的单一属性。</p>}</div>
    {examples.length > 0 && <div className="familiar-examples"><h4>拿认识的伙伴试试看</h4><div>{examples.map(p => <div className="familiar-example" key={p.id}><PokemonArt pokemon={p} /><span>{p.name}</span><b>×{effectiveness(attack, p.types)}</b></div>)}</div></div>}
    <p className="lesson-note">上面的大图标表示单一属性；伙伴图片的数字会一起计算它的两种属性。</p></section>
    <section className="type-lesson incoming"><h3><Shield size={22} /> 给伙伴提个醒</h3><div className="incoming-groups">{[4, 2].map(multiplier => {
      const group = incoming.filter(item => item.multiplier === multiplier);
      return group.length ? <div className="incoming-row" key={multiplier}><div className="incoming-types">{group.map(({ type }) => <TypePicture key={type} type={type} />)}</div><div className="incoming-arrow"><ArrowRight size={25} aria-hidden="true" /><b>×{multiplier}</b><span>{multiplier === 4 ? '特别留意' : '留意'}</span></div><div className="lesson-partner"><PokemonArt pokemon={partner} /><Shield size={24} aria-hidden="true" /></div></div> : null;
    })}</div>{!incoming.length && <p className="lesson-note">没有效果加倍的属性招式。</p>}<p className="lesson-note">这些属性的招式打向伙伴时，力量会变大。箭头指向的是受到招式的伙伴。</p>
    <details className="resistance-details"><summary><Shield size={19} /> 哪些招式影响小？<ChevronDown size={16} /></summary><div className="badge-list">{resistances(partner.types).map(({ type, multiplier }) => <TypeBadge key={type} type={type} multiplier={multiplier} />)}</div></details></section></div>
    <p className="panel-footnote">陪看小提示：这是招式属性的比较，不代表某只宝可梦一定能赢。×2 / ×4 为属性效果倍率；×0 为无效，不计算特性、等级或其他招式效果。</p>
  </section>;
}
