'use client';
import Link from 'next/link';
import {ArrowRight,BookOpen,Check,Languages,LockKeyhole,NotebookPen,Plus,Puzzle,Sparkles,Star} from 'lucide-react';
import {MACHINE_STAR_COST,stages,type LearningState} from '@/domain/learning';
import {pokemonById} from '@/domain/pokemon';
import {useCollection} from './collection-provider';
import {PokemonArt} from './pokemon-art';
import {PokeballLoader} from './pokeball-loader';
import styles from './learning-station.module.css';

export function LearningPartner({compact=false}:{compact?:boolean}){
 const {snapshot}=useCollection();
 const id=snapshot.team?.find(id=>snapshot.records.some(r=>r.pokemonId===id))??snapshot.records[0]?.pokemonId;
 const partner=pokemonById.get(id??25)!;
 return <div className={compact?styles.partnerCompact:styles.partner}>
  <div className={styles.partnerHalo} aria-hidden="true"/>
  <PokemonArt pokemon={partner} hidden={!id}/>
  {!compact&&<span className={styles.partnerLabel}>{id?`${partner.name}陪你学`:'伙伴陪你学'}</span>}
 </div>;
}
export function LearningLoading(){
 return <section className={styles.loading} aria-busy="true">
  <span className={styles.kicker}>学习小站</span>
  <PokeballLoader label="正在准备学习手帐…"/>
  <div className={styles.loadingLines} aria-hidden="true"><span/><span/></div>
 </section>;
}
export function LearningStation({data,rewardAvailable,busy,onStart}:{data:LearningState;rewardAvailable:boolean;busy:boolean;onStart:()=>void}){
 const lesson=data.active,resuming=!!lesson&&!lesson.finishedAt;
 const completed=resuming?lesson.questions.filter(q=>q.done).length:0;
 const stage=data.fixedStage??data.stage;
 return <div className={styles.station}>
  <div className={styles.mainGrid}>
   <button className={styles.mathCard} disabled={busy} onClick={onStart} aria-label={resuming?'继续数学练习':rewardAvailable?'开始数学五题':'开始数学自由练习'}>
    <div className={styles.mathCopy}>
     <span className={styles.kicker}><NotebookPen size={16}/> 今日的小练习</span>
     <h2>和伙伴一起，<br/>学会一点点<span>。</span></h2>
     <span className={styles.lessonTag}>数学 · 20以内减法</span>
     <span className={styles.startButton}>{busy?'正在准备…':resuming?'继续这五题':rewardAvailable?'开始五题':'自由练习'}<ArrowRight size={22}/></span>
     <span className={styles.miniProgress} aria-label={`已完成 ${completed} 题，共5题`}>
      {Array.from({length:5},(_,i)=><span key={i} className={i<completed?styles.complete:''}>{i<completed?<Check size={13}/>:<span/>}</span>)}
      <small>{completed} / 5</small>
     </span>
     {!resuming&&!rewardAvailable&&<small className={styles.freeNote}>今天的奖励已领完，还可以继续练习</small>}
    </div>
    <div className={styles.mathArt}><span className={styles.numberTile} aria-hidden="true">1 2 3</span><LearningPartner/><span className={styles.artSpark} aria-hidden="true"><Sparkles size={28}/></span></div>
   </button>
   <aside className={styles.wallet}>
    <span className={styles.kicker}><Star size={16}/> 星星口袋</span>
    <div className={styles.starMedallion} aria-hidden="true"><Star size={42} fill="currentColor" strokeWidth={1.2}/></div>
    <div className={styles.walletAmount}>{data.balance}<span>颗学习星</span></div>
    <div className={styles.starTrack} role="progressbar" aria-label="兑换一个招式所需星星" aria-valuemin={0} aria-valuemax={MACHINE_STAR_COST} aria-valuenow={Math.min(data.balance,MACHINE_STAR_COST)}><span style={{width:`${Math.min(100,data.balance/MACHINE_STAR_COST*100)}%`}}/></div>
    <p>{data.balance>=MACHINE_STAR_COST?'可以选一个新招式啦':`再攒 ${MACHINE_STAR_COST-data.balance} 颗，换一个新招式`}</p>
    <Link href="/learn/moves" className={styles.shopLink}>看看招式<ArrowRight size={17}/></Link>
   </aside>
  </div>
  <section className={styles.route} aria-label="减法学习进度">
   <div className={styles.routeHeading}><span><BookOpen size={17}/>我们的学习路线</span><small>现在学：{stages[stage].name}</small></div>
   <div className={styles.routeSteps}>{stages.map((s,i)=><div key={s.name} className={`${styles.step} ${i===stage?styles.current:''}`} aria-current={i===stage?'step':undefined}><span className={styles.stepNumber}>{i<stage?<Check size={15}/>:String(i+1).padStart(2,'0')}</span><div><strong>{s.name}</strong><small>{s.example}</small></div>{i===stage&&<span className={styles.currentDot} aria-label="当前阶段"/>}</div>)}</div>
  </section>
  <section className={styles.coming} aria-label="更多学习内容，建设中"><span className={styles.comingHeading}><Plus size={16}/>更多小发现</span><div>{[{Icon:BookOpen,name:'语文'},{Icon:Puzzle,name:'思维'},{Icon:Languages,name:'英语'}].map(({Icon,name})=><div className={styles.comingItem} key={name}><Icon size={22} strokeWidth={1.5}/><strong>{name}</strong><small><LockKeyhole size={12}/>建设中</small></div>)}</div></section>
 </div>;
}
