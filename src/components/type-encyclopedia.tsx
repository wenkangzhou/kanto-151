'use client';
import { useT } from '@/lib/i18n/locale';

import Link from 'next/link';
import {useState} from 'react';
import {ArrowLeft,ArrowRight,Grid2X2,Search,Shield,Swords,Volume2} from 'lucide-react';
import {guideTypes,guideColors,guideEffectiveness,multiplierLabel,type GuideType} from '@/domain/type-encyclopedia';
import {TYPE_NAMES} from '@/domain/types';
import {useTypeVoice} from './type-badge';
import {TypeSymbol} from './type-symbol';
import styles from './type-encyclopedia.module.css';

function TypeIcon({type,size=24}:{type:GuideType;size?:number}){
  return <span className={styles.icon} style={{background:guideColors[type]}}><TypeSymbol type={type} size={size}/></span>;}
export function TypeTopicCard(){
  const localize = useT();return <article className="encyclopedia-topic"><Link href="/pokedex/encyclopedia/types" className="ball-topic-link" aria-label={localize("属性克制速查")}><div className={styles.topic}><div className={styles.topicGrid}>{(['fire','water','grass','electric','ground','flying'] as GuideType[]).map(t=><TypeIcon key={t} type={t} size={34}/>)}</div><span className={styles.topicSearch}><Search size={56}/></span></div><div className="ball-topic-caption"><div><span>{localize("17 种属性 · 一起查一查")}</span><h2>{localize("属性克制速查")}</h2></div><span className="topic-enter"><ArrowRight size={26}/></span></div></Link></article>;}

function RelationGroup({title,values,onChoose}:{title:string;values:{type:GuideType;value:number}[];onChoose:(t:GuideType)=>void}){
  const localize = useT();
 return <div className={styles.relation}><h3>{localize(title)}</h3><div className={styles.chips}>{values.length?values.map(x=><button key={x.type} onClick={()=>onChoose(x.type)} aria-label={localize(`${TYPE_NAMES[x.type]}，${x.value}倍，听属性名称`)}><TypeIcon type={x.type} size={19}/><span>{localize(TYPE_NAMES[x.type])}</span><b data-value={x.value}>{localize(`×${multiplierLabel(x.value)}`)}</b></button>):<span className={styles.empty}>{localize("没有这类属性")}</span>}</div></div>;
}

export function TypeEncyclopedia(){
  const localize = useT();
 const [selected,setSelected]=useState<GuideType>('water');
 const [second,setSecond]=useState<GuideType|null>(null);
 const [mode,setMode]=useState<'quick'|'chart'>('quick');
 const [cell,setCell]=useState<{attack:GuideType;defense:GuideType}>({attack:'water',defense:'fire'});
 const speakType=useTypeVoice();
 const defenders:GuideType[]=second?[selected,second]:[selected];
 const attacks=guideTypes.map(type=>({type,value:guideEffectiveness(selected,[type])}));
 const defenses=guideTypes.map(type=>({type,value:guideEffectiveness(type,defenders)}));
 function choose(type:GuideType){speakType(type);setSelected(type);if(type===second)setSecond(null);}
 return <div className="page encyclopedia-page"><Link className="back-link" href="/pokedex/encyclopedia"><ArrowLeft size={20}/>{localize("小百科")}</Link><div className="page-heading"><div><div className="eyebrow">{localize("关都 · 火红／叶绿 · 17 种属性")}</div><h1>{localize("属性克制速查")}</h1></div></div>
 <div className={styles.toolbar} role="group" aria-label={localize("查询方式")}><button aria-pressed={mode==='quick'} onClick={()=>setMode('quick')}><Search size={20}/>{localize("选属性查")}</button><button aria-pressed={mode==='chart'} onClick={()=>setMode('chart')}><Grid2X2 size={20}/>{localize("完整克制表")}</button></div>
 {mode==='quick'?<><section className={styles.picker}><h2>{localize("想查哪个属性？")}</h2><div className={styles.types} role="group" aria-label={localize("选择属性")}>{guideTypes.map(t=><button key={t} aria-pressed={selected===t} onClick={()=>choose(t)}><TypeIcon type={t}/><span>{localize(TYPE_NAMES[t])}</span></button>)}</div></section>
 <div className={styles.panels}><section className={styles.panel}><header><span className={styles.sectionIcon}><Swords size={23}/></span><div><small>{localize("攻击 · 看招式属性")}</small><h2>{localize(TYPE_NAMES[selected])}{localize("招式打谁？")}</h2></div><TypeIcon type={selected} size={30}/></header>
 <RelationGroup title={localize("效果绝佳")} values={attacks.filter(x=>x.value>1)} onChoose={speakType}/><RelationGroup title={localize("效果不太好")} values={attacks.filter(x=>x.value>0&&x.value<1)} onChoose={speakType}/><RelationGroup title={localize("没有效果")} values={attacks.filter(x=>x.value===0)} onChoose={speakType}/><details className={styles.neutral}><summary>{localize("效果正常 · ×1")}</summary><RelationGroup title={localize("其余属性")} values={attacks.filter(x=>x.value===1)} onChoose={speakType}/></details></section>
 <section className={`${styles.panel} ${styles.defense}`}><header><span className={styles.sectionIcon}><Shield size={23}/></span><div><small>{localize("防守 · 看宝可梦属性")}</small><h2>{localize(defenders.map(t=>TYPE_NAMES[t]).join('＋'))}{localize("怕什么？")}</h2></div><TypeIcon type={selected} size={30}/></header>
 <label className={styles.second}>{localize("还有第二种属性？")}<select aria-label={localize("防守的第二属性")} value={second??''} onChange={e=>{const type=e.target.value as GuideType|null;setSecond(type||null);if(type)speakType(type);}}><option value="">{localize("没有 · 单属性")}</option>{guideTypes.filter(t=>t!==selected).map(t=><option value={t} key={t}>{localize(TYPE_NAMES[t])}</option>)}</select></label>
 <RelationGroup title={localize("要小心这些招式")} values={defenses.filter(x=>x.value>1).sort((a,b)=>b.value-a.value)} onChoose={speakType}/><RelationGroup title={localize("能抵抗这些招式")} values={defenses.filter(x=>x.value>0&&x.value<1).sort((a,b)=>a.value-b.value)} onChoose={speakType}/><RelationGroup title={localize("这些招式没有效果")} values={defenses.filter(x=>x.value===0)} onChoose={speakType}/><details className={styles.neutral}><summary>{localize("效果正常 · ×1")}</summary><RelationGroup title={localize("其余招式")} values={defenses.filter(x=>x.value===1)} onChoose={speakType}/></details></section></div><p className={styles.hint}><Volume2 size={17}/>{localize("点一下属性标签，听听属性名称")}</p></>:<section className={styles.chartPanel}>
 <div className={styles.readout} aria-live="polite"><TypeIcon type={cell.attack}/><strong>{localize(TYPE_NAMES[cell.attack])}{localize("招式")}</strong><ArrowRight size={22}/><TypeIcon type={cell.defense}/><strong>{localize(TYPE_NAMES[cell.defense])}{localize("属性")}</strong><b data-value={guideEffectiveness(cell.attack,[cell.defense])}>×{localize(multiplierLabel(guideEffectiveness(cell.attack,[cell.defense])))}</b></div>
 <p className={styles.chartHint}>{localize("左边找招式，上边找对方。点格子看结果；左右滑动查看全部。")}</p>
 <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={localize("完整属性克制表，可横向滚动")}><table className={styles.table}><caption>{localize("火红／叶绿属性克制表：行是招式，列是防守属性")}</caption><thead><tr><th scope="col" className={styles.corner}>{localize("对方 →")}<br/>{localize("招式 ↓")}</th>{guideTypes.map(t=><th scope="col" key={t} data-selected={cell.defense===t}><button className={styles.headerVoice} aria-label={localize(`听${TYPE_NAMES[t]}属性名称`)} onClick={()=>speakType(t)}><TypeIcon type={t} size={21}/><span>{localize(TYPE_NAMES[t])}</span></button></th>)}</tr></thead><tbody>{guideTypes.map(a=><tr key={a}><th scope="row" data-selected={cell.attack===a}><button className={styles.headerVoice} aria-label={localize(`听${TYPE_NAMES[a]}属性名称`)} onClick={()=>speakType(a)}><TypeIcon type={a} size={21}/><span>{localize(TYPE_NAMES[a])}</span></button></th>{guideTypes.map(d=>{const v=guideEffectiveness(a,[d]);return <td key={d} data-highlight={cell.attack===a||cell.defense===d}><button data-value={v} aria-pressed={cell.attack===a&&cell.defense===d} aria-label={localize(`${TYPE_NAMES[a]}招式对${TYPE_NAMES[d]}属性，${v}倍`)} onClick={()=>setCell({attack:a,defense:d})}>{localize(v===1?'·':`×${multiplierLabel(v)}`)}</button></td>;})}</tr>)}</tbody></table></div>
 <div className={styles.legend}><span><b data-value={2}>×2</b>{localize("效果绝佳")}</span><span><b data-value={.5}>×½</b>{localize("效果不太好")}</span><span><b data-value={0}>×0</b>{localize("没有效果")}</span><span>{localize("· 正常 ×1")}</span></div></section>}
 <details className="encyclopedia-notes"><summary>{localize("给家长看的版本说明")}</summary><p>{localize("本页按《宝可梦火红／叶绿》（第三世代）的 17 种属性计算：没有妖精属性，钢属性抵抗幽灵和恶。与图鉴中采用现代规则的属性信息可能不同；也不使用动画剧情判断倍率。")}</p><p>{localize("攻击查询看招式的属性，防守查询看宝可梦的一种或两种属性。双属性的倍率相乘，例如水与飞行被电招式打中时为 ×4，地面与飞行被电招式打中时为 ×0。×1 表示属性效果正常。这里仅查属性关系，不计特性（如飘浮）、招式特例、天气、能力值等实际对战条件。")}</p><p>{localize("自由查询，不设答题、奖励或解锁。点击属性标签可听属性名称，复用已有语音。")}</p><a href="https://pokemondb.net/type/old" target="_blank" rel="noreferrer">{localize("资料：第二至第五世代属性克制表 ↗")}</a></details></div>;
}
