'use client';
import Link from 'next/link';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,Lightbulb,Play,Plus,Star,Volume2,VolumeX} from 'lucide-react';
import {pinyinById,pinyinInitialAudio,pinyinPool,pinyinStages,newPinyin,type PinyinQuestion,type PinyinItem} from '@/domain/pinyin';
import {usageDay} from '@/domain/play-time';
import {learningClient} from '@/lib/learning-client';
import {type LearningView} from '@/lib/learning-session';
import {speakLearning,stopLearningSpeech} from '@/lib/learning-speech';
import {usePinyinAudio} from '@/lib/pinyin-audio';
import {LearningLoading,LearningPartner} from './learning-station';
import {PinyinPicture} from './pinyin-picture';
import styles from './pinyin-learning.module.css';

export function PinyinLearning(){
 const [view,setView]=useState<LearningView>(()=>typeof window==='undefined'?{data:null,pending:0,syncing:false,error:''}:learningClient().getSnapshot());
 const [practicing,setPracticing]=useState(false),[busy,setBusy]=useState(false),[muted,setMuted]=useState(false),[error,setError]=useState('');
 const [today,setToday]=useState(()=>usageDay(Date.now()));
 const [celebration,setCelebration]=useState<PinyinQuestion|null>(null),[wrong,setWrong]=useState('');
 const [built,setBuilt]=useState(false),[parts,setParts]=useState<string[]>([]);
 const elapsed=useRef(0),sending=useRef(false),startRequest=useRef<Record<string,unknown>|null>(null);
 const {play,stop,audioError,playing}=usePinyinAudio();
 useEffect(()=>{
  const client=learningClient();const update=()=>setView(client.getSnapshot());
  const unsubscribe=client.subscribe(update);update();void client.load();
  const clock=setInterval(()=>setToday(usageDay(Date.now())),15000);
  return()=>{unsubscribe();clearInterval(clock);void client.flush();stopLearningSpeech();};
 },[]);
 const data=view.data,pinyin=data?.pinyin??newPinyin(),lesson=pinyin.active;
 const question=celebration??lesson?.questions.find(q=>!q.done);
 const stage=lesson&&!lesson.finishedAt?lesson.stage:pinyin.fixedStage??pinyin.stage;
 const questionId=question?.id;
 const target=question?pinyinById.get(question.target):undefined;
 const listen=useCallback((ids:string[])=>{if(!muted)play(ids);},[muted,play]);
 const say=useCallback((text:string)=>{stop();if(!muted)speakLearning(text);},[muted,stop]);
 useEffect(()=>{
  if(!practicing||!questionId)return;
  elapsed.current=0;
  const tick=setInterval(()=>{if(!document.hidden)elapsed.current++;},1000);
  return()=>{clearInterval(tick);stop();stopLearningSpeech();};
 },[practicing,questionId,stop]); // Audio starts from a tap to preserve Safari's user gesture.
 useEffect(()=>{
  if(!celebration)return;
  const timer=setTimeout(()=>{setCelebration(null);setWrong('');setParts([]);setBuilt(false);},1600);
  return()=>clearTimeout(timer);
 },[celebration]);
 async function start(){
  if(sending.current)return;sending.current=true;setBusy(true);setError('');
  startRequest.current??={action:'start',subject:'pinyin',requestId:crypto.randomUUID()};
  try{await learningClient().start(startRequest.current);startRequest.current=null;setPracticing(true);setWrong('');setBuilt(false);setParts([]);stop();stopLearningSpeech();}
  catch(e){setError(e instanceof Error?e.message:'暂时无法开始，请重试。');}
  finally{sending.current=false;setBusy(false);}
 }
 function act(action:'answer'|'hint',answer?:string){
  if(!lesson||!question||sending.current||celebration)return;
  sending.current=true;setError('');
  try{
   const next=learningClient().apply({action,answer,subject:'pinyin',requestId:crypto.randomUUID(),lessonId:lesson.id,questionId:question.id,seconds:elapsed.current});
   elapsed.current=0;
   const updated=next.pinyin!.active!.questions.find(q=>q.id===question.id)!;
   if(action==='hint'){setBuilt(true);listen([updated.target]);}
   else if(updated.done){setCelebration(updated);setWrong('');say('答对啦！');}
   else{setWrong(answer??'');say('再听一听，试一次。');}
  }catch(e){setError(e instanceof Error?e.message:'没能保存，请再试一次。');}
  finally{sending.current=false;}
 }
 function part(name:string,audio:string){setParts(old=>old.includes(name)?old:[...old,name]);listen([audio]);}
 function preview(item:PinyinItem){listen([item.id]);}
 const finished=practicing&&lesson?.finishedAt&&!celebration;
 const rewardAvailable=!!data&&(data.day!==today||data.rounds<data.dailyRounds);
 return <div className={`page ${styles.page}`}>
  <Link className="back-link" href="/learn"><ArrowLeft size={19}/>学习小站</Link>
  <header className={styles.header}><div><span>和伙伴一起，听听拼音</span><h1>拼音小站<span>。</span></h1></div><div className={styles.tools}><strong><Star size={19}/>{data?.balance??'—'}</strong><button type="button" className={styles.soundToggle} title={muted?'开启拼音声音':'关闭拼音声音'} aria-label={muted?'开启拼音声音':'关闭拼音声音'} aria-pressed={!muted} onClick={()=>{setMuted(!muted);stop();stopLearningSpeech();}}>{muted?<VolumeX/>:<Volume2/>}</button></div></header>
  {view.pending>0&&<p className={styles.status} role="status">{view.error?'记录已保存在本机，等待同步':'记录已保存在本机'}{view.error&&<button onClick={()=>void learningClient().flush()}>重试同步</button>}</p>}
  {(error||(!view.pending&&view.error))&&<p className="form-error" role="alert">{error||view.error}<button className="text-link" onClick={()=>data?void start():void learningClient().load()}>重试</button></p>}
  {audioError&&<p className="form-error" role="alert">{audioError}</p>}
  {!data?<LearningLoading/>:finished?<section className={styles.result}>
   <LearningPartner compact/><h2>五个小活动完成啦！</h2><strong className={styles.earned}>+{lesson.questions.reduce((n,q)=>n+q.stars,0)}<Star fill="currentColor"/></strong>
   <div className={styles.results}>{lesson.questions.map((q,i)=><div key={q.id}><small>第{i+1}题</small><b>{pinyinById.get(q.target)!.text}</b><span>{q.first?'独立答对':q.hint?'提示后完成':'自己改对'}</span></div>)}</div>
   <p>{view.pending?'这轮记录已保存在本机，星星同步后可兑换':lesson.rewarded?'星星已存入口袋':'自由练习完成啦'}</p>
   <div className="action-row"><button className="button secondary" onClick={()=>setPracticing(false)}>回拼音小站</button><Link className="button" href="/learn">回学习小站</Link></div>
  </section>:practicing&&question&&target?<>
   <div className={styles.progress}><button className="back-link" disabled={!!celebration} onClick={()=>{setPracticing(false);stop();stopLearningSpeech();void learningClient().flush();}}><ArrowLeft size={18}/>稍后继续</button><div className="lesson-dots" aria-label={`第${lesson!.questions.findIndex(q=>q.id===question.id)+1}题，共5题`}>{lesson!.questions.map((q,i)=><span key={q.id} className={q.done?'done':q.id===question.id?'active':''}>{q.done?<Check size={16}/>:i+1}</span>)}</div></div>
   <section className={styles.activity}>
    <div className={styles.activityHeading}><LearningPartner compact/><h2>{question.kind==='listen'?'听声音，找拼音':question.kind==='picture'?'看图片，找拼音':'拼起来，听一听'}</h2>{!lesson!.rewarded&&<small>自由练习</small>}</div>
    <div className={styles.prompt}>
     {question.kind==='picture'&&<div className={styles.picture}><PinyinPicture item={target}/></div>}
     {question.kind==='blend'?<div className={styles.blend}>
      <button className={parts.includes('initial')?styles.touched:''} disabled={muted||!!celebration} aria-label={`听声母${target.initial}的呼读音`} onClick={()=>part('initial',pinyinInitialAudio[target.initial])}>{target.initial}<Volume2 size={19}/></button><Plus size={22}/>
      <button className={parts.includes('final')?styles.touched:''} disabled={muted||!!celebration} aria-label="听韵母" onClick={()=>part('final',target.finalAudio)}>{target.final}<Volume2 size={19}/></button>
      <button className={styles.join} disabled={muted||!!celebration||parts.length<2} onClick={()=>{setBuilt(true);listen([target.id]);}}><ArrowRight/>合起来听</button>
     </div>:<button className={styles.listen} disabled={muted||!!celebration} onClick={()=>listen([target.id])} aria-label="听题目读音"><Volume2 size={33}/><span>{playing?'再听一次':'点我听一听'}</span></button>}
    </div>
    {muted&&<button className={styles.soundNotice} onClick={()=>{setMuted(false);play([target.id]);}}>这题需要听声音，点这里开启<Volume2 size={18}/></button>}
    {question.kind==='blend'&&!built&&!muted&&<p className={styles.cue}>点两张卡片，再合起来听</p>}
    <div className={styles.options}>{question.options.map(id=><button key={id} disabled={!!celebration||muted||(question.kind==='blend'&&!built)} aria-label={`选择${pinyinById.get(id)!.text}`} className={`${wrong===id?styles.wrong:''} ${celebration&&id===question.target?styles.correct:''}`} onClick={()=>act('answer',id)}>{pinyinById.get(id)!.text}{celebration&&id===question.target&&<Check size={22}/>}</button>)}</div>
    <p className={styles.feedback} role="status">{celebration?<>答对啦！{celebration.stars>0&&<> +{celebration.stars}<Star size={18} fill="currentColor"/></>}</>:wrong?'再听一听，试一次。':''}</p>
    {question.hint&&!celebration&&<div className={styles.help}><PinyinPicture item={target}/><div><strong>{target.initial} + {target.final} → {target.text}</strong><button disabled={muted} onClick={()=>listen([target.id])}><Volume2 size={20}/>再听一次</button></div></div>}
    {!celebration&&<button className="button secondary" disabled={muted} onClick={()=>act('hint')}><Lightbulb size={19}/>帮帮我</button>}
   </section>
  </>:<>
   <section className={styles.hero}><div><span className={styles.eyebrow}>语文 · 生活里的拼音</span><h2>小小声音，<br/>藏在生活里。</h2><p>{pinyinStages[stage]}</p><button className="button" disabled={busy} onClick={()=>void start()}><Play size={19}/>{busy?'正在准备…':lesson&&!lesson.finishedAt?'继续这五题':rewardAvailable?'开始五个小活动':'自由练习'}<ArrowRight size={19}/></button><small>{lesson&&!lesson.finishedAt?`已完成 ${lesson.questions.filter(q=>q.done).length} / 5`:rewardAvailable?'各学科共用每日奖励轮数':'今天的奖励已领完，还可以继续练习'}</small></div><div className={styles.heroArt}><span>{pinyinPool(stage)[0].initial} + {pinyinPool(stage)[0].final}</span><LearningPartner/></div></section>
   <section className={styles.explore}><h2><BookOpen size={20}/>先听一听</h2><div className={styles.cards}>{pinyinPool(stage).map(item=><button key={item.id} disabled={muted} onClick={()=>preview(item)} aria-label={`听${item.text}，${item.word}`}><PinyinPicture item={item}/><strong>{item.text}</strong><span>{item.word}<Volume2 size={18}/></span></button>)}</div></section>
   <details className={styles.notes}><summary>给家长看的说明</summary><p>目前有 8 个阶段、15 个音节，从 m、b 开始，再认识 d、t、l，穿插混合复习。图画用于帮助联想，其中“木”画成树、“八”画成八个小球；“妈妈、肚子、梯子、蜡烛”取第一个字的读音。“大”用一大一小两个球作比较。每个新声母先练三个音节；连续两轮各独立答对至少四题会进入下一阶段，也可以由家长固定阶段。声调跟随音节展示，暂不单独考声调。点击上面的图卡熟悉读音，不消耗奖励轮次。</p><p>拼读卡里的声母使用呼读音，合起来听的是完整音节，不把两段录音机械拼接。教学读音使用本地普通话录音，普通操作提示使用系统声音；不使用英语字母读音，不做录音评分。家长可在学习手帐调整拼音阶段。</p><a href="https://github.com/davinfifield/mp3-chinese-pinyin-sound" target="_blank" rel="noreferrer">录音来源与许可 ↗</a></details>
  </>}
 </div>;
}
