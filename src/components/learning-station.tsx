'use client';
import { useT } from '@/lib/i18n/locale';

import Link from 'next/link';
import {ThinkingIcon} from './thinking-icon';
import {ArrowRight,BookOpen,Check,NotebookPen,Sparkles,Star} from 'lucide-react';
import {MACHINE_STAR_COST,stages,type LearningState} from '@/domain/learning';
import {pokemonById} from '@/domain/pokemon';
import {useCollection} from './collection-provider';
import {PokemonArt} from './pokemon-art';
import {PokeballLoader} from './pokeball-loader';
import styles from './learning-station.module.css';

export function LearningPartner({compact=false}:{compact?:boolean}){
  const localize = useT();
 const {snapshot}=useCollection();
 const id=snapshot.team?.find(id=>snapshot.records.some(r=>r.pokemonId===id))??snapshot.records[0]?.pokemonId;
 const partner=pokemonById.get(id??25)!;
 return <div className={compact?styles.partnerCompact:styles.partner}>
  <div className={styles.partnerHalo} aria-hidden="true"/>
  <PokemonArt pokemon={partner} hidden={!id} sizes={compact?'140px':'(max-width: 700px) 40vw, 320px'}/>
  {!compact&&<span className={styles.partnerLabel}>{localize(id?`${partner.name}陪你学`:'伙伴陪你学')}</span>}
 </div>;
}
export function LearningLoading(){
  const localize = useT();
 return <section className={styles.loading} aria-busy="true">
  <span className={styles.kicker}>{localize("学习小站")}</span>
  <PokeballLoader label={localize("正在准备学习手帐…")}/>
  <div className={styles.loadingLines} aria-hidden="true"><span/><span/></div>
 </section>;
}
export function LearningStation({data,rewardAvailable,busy,onStart}:{data:LearningState;rewardAvailable:boolean;busy:boolean;onStart:()=>void}){
  const localize = useT();
 const lesson=data.active,resuming=!!lesson&&!lesson.finishedAt;
 const completed=resuming?lesson.questions.filter(q=>q.done).length:0;
 const stage=data.fixedStage??data.stage;
 return <div className={styles.station}>
  <div className={styles.mainGrid}>
   <button className={styles.mathCard} disabled={busy} onClick={onStart} aria-label={localize(resuming?'继续数学练习':rewardAvailable?'开始数学五题':'开始数学自由练习')}>
    <div className={styles.mathCopy}>
     <span className={styles.kicker}><NotebookPen size={16}/>{localize("今日的小练习")}</span>
     <h2>{localize("和伙伴一起，")}<br/>{localize("学会一点点")}<span>{localize("。")}</span></h2>
     <span className={styles.lessonTag}>{localize("数学 · 20以内减法")}</span>
     <span className={styles.startButton}>{localize(busy?'正在准备…':resuming?'继续这五题':rewardAvailable?'开始五题':'自由练习')}<ArrowRight size={22}/></span>
     <span className={styles.miniProgress} aria-label={localize(`已完成 ${completed} 题，共5题`)}>
      {Array.from({length:5},(_,i)=><span key={i} className={i<completed?styles.complete:''}>{i<completed?<Check size={13}/>:<span/>}</span>)}
      <small>{localize(completed)} / 5</small>
     </span>
     {!resuming&&!rewardAvailable&&<small className={styles.freeNote}>{localize("今天的奖励已领完，还可以继续练习")}</small>}
    </div>
    <div className={styles.mathArt}><span className={styles.numberTile} aria-hidden="true">1 2 3</span><LearningPartner/><span className={styles.artSpark} aria-hidden="true"><Sparkles size={28}/></span></div>
   </button>
   <aside className={styles.wallet}>
    <span className={styles.kicker}><Star size={16}/>{localize("星星口袋")}</span>
    <div className={styles.starMedallion} aria-hidden="true"><Star size={42} fill="currentColor" strokeWidth={1.2}/></div>
    <div className={styles.walletAmount}>{localize(data.balance)}<span>{localize("颗学习星")}</span></div>
    <div className={styles.starTrack} role="progressbar" aria-label={localize("兑换一个招式所需星星")} aria-valuemin={0} aria-valuemax={MACHINE_STAR_COST} aria-valuenow={Math.min(data.balance,MACHINE_STAR_COST)}><span style={{width:`${Math.min(100,data.balance/MACHINE_STAR_COST*100)}%`}}/></div>
    <p>{localize(data.balance>=MACHINE_STAR_COST?'可以选一个新招式啦':`再攒 ${MACHINE_STAR_COST-data.balance} 颗，换一个新招式`)}</p>
    <Link href="/learn/moves" className={styles.shopLink}>{localize("看看招式")}<ArrowRight size={17}/></Link>
   </aside>
  </div>
  <section className={styles.route} aria-label={localize("减法学习进度")}>
   <div className={styles.routeHeading}><span><BookOpen size={17}/>{localize("数学学习路线")}</span><small>{localize("现在学：")}{localize(stages[stage].name)}</small></div>
   <div className={styles.routeSteps}>{stages.map((s,i)=><div key={s.name} className={`${styles.step} ${i===stage?styles.current:''}`} aria-current={i===stage?'step':undefined}><span className={styles.stepNumber}>{i<stage?<Check size={15}/>:String(i+1).padStart(2,'0')}</span><div><strong>{localize(s.name)}</strong><small>{localize(s.example)}</small></div>{i===stage&&<span className={styles.currentDot} aria-label={localize("当前阶段")}/>}</div>)}</div>
  </section>
  <Link href="/learn/pinyin" className={styles.pinyinCard} aria-label={localize("去语文学拼音")}><div className={styles.pinyinLetters} aria-hidden="true"><span>m</span><span>ā</span></div><div><small>{localize("语文 · 生活里的拼音")}</small><h2>{localize("听一听，拼出小小声音")}</h2><p>{localize(data.pinyin?.active&&!data.pinyin.active.finishedAt?`继续拼音 · 已完成 ${data.pinyin.active.questions.filter(q=>q.done).length} / 5`:'妈妈、米、木……声音藏在生活里')}</p></div><ArrowRight size={25}/></Link>
  <Link href="/learn/thinking" className={styles.pinyinCard} aria-label={localize("去思维找规律和不同")}><div className={styles.thinkingIcon}><ThinkingIcon/></div><div><small>{localize("思维 · 观察与规律")}</small><h2>{localize("发现伙伴的小秘密")}</h2><p>{localize(data.thinking?.active&&!data.thinking.active.finishedAt?`继续思维 · 已完成 ${data.thinking.active.questions.filter(q=>q.done).length} / 5`:'找规律，找出不一样的伙伴')}</p></div><ArrowRight size={25}/></Link>
 </div>;
}
