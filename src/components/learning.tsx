'use client';
import { useT } from '@/lib/i18n/locale';

import Link from 'next/link';
import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowLeft,Check,Lightbulb,RotateCcw,Star,Volume2,VolumeX,X} from 'lucide-react';
import {learningClient} from '@/lib/learning-client';
import {type LearningState,type Question} from '@/domain/learning';
import {usageDay} from '@/domain/play-time';
import {LearningStation,LearningLoading,LearningPartner} from './learning-station';
import styles from './learning-station.module.css';
import {SubtractionPractice} from './subtraction-practice';
import {speakLearning,stopLearningSpeech} from '@/lib/learning-speech';

export function Learning(){
  const localize = useT();
 const [data,setData]=useState<LearningState|null>(()=>typeof window==='undefined'?null:learningClient().getSnapshot().data),[error,setError]=useState(''),[busy,setBusy]=useState(false),[practicing,setPracticing]=useState(false),[answer,setAnswer]=useState(''),[feedback,setFeedback]=useState(''),[muted,setMuted]=useState(false);
 const [celebration,setCelebration]=useState<{question:Question;flight:CSSProperties}|null>(null);
 const balanceElement=useRef<HTMLElement>(null),equationElement=useRef<HTMLDivElement>(null);
 const [replaceAnswer,setReplaceAnswer]=useState(false);
 const [helpRevision,setHelpRevision]=useState(0);
 const [pending,setPending]=useState<Record<string,unknown>|null>(null);
 const [today,setToday]=useState(()=>usageDay(Date.now()));
 const mutedRef=useRef(false);
 const sending=useRef(false),elapsed=useRef(0),ticking=useRef(0);
 const [sync,setSync]=useState({pending:0,syncing:false,error:''});
 const load=useCallback(async()=>{await learningClient().load();},[]);
 useEffect(()=>{
   const client=learningClient();
   const update=()=>{const view=client.getSnapshot();setData(view.data);setSync({pending:view.pending,syncing:view.syncing,error:view.error});};
   const unsubscribe=client.subscribe(update);update();void client.load();
   const tick=setInterval(()=>setToday(usageDay(Date.now())),15000);
   return()=>{unsubscribe();void client.flush();clearInterval(tick);stopLearningSpeech();};
 },[]);
 const lesson=data?.active;const question=celebration?.question??lesson?.questions.find(q=>!q.done);
 const questionId=question?.id,a=question?.a,b=question?.b;
 const say=useCallback((text:string)=>{if(!mutedRef.current)speakLearning(text);},[]);
 useEffect(()=>{
   if(!practicing||!questionId)return;
   say(`${a}减${b}等于几？`);
   elapsed.current=0;ticking.current=performance.now();
   const tick=setInterval(()=>{const now=performance.now();if(!document.hidden)elapsed.current+=Math.min(1,(now-ticking.current)/1000);ticking.current=now;},1000);
   return()=>{clearInterval(tick);stopLearningSpeech();};
 },[practicing,questionId,a,b,say]); // The current question owns its voice and active-time counter.
 useEffect(()=>{
   if(!celebration)return;
   const timer=setTimeout(()=>{setCelebration(null);setAnswer('');setFeedback('');},1600);
   return()=>clearTimeout(timer);
 },[celebration]);
 function digit(n:number){setAnswer(v=>replaceAnswer?String(n):(v+n).slice(-2));setReplaceAnswer(false);setFeedback('');}
 async function act(action:Record<string,unknown>){
   if(sending.current||celebration)return;sending.current=true;setBusy(true);setError('');
   const body=pending??{...action,requestId:crypto.randomUUID()};setPending(body);
   try{
     const client=learningClient();
     const next=body.action==='start'?await client.start(body):client.apply(body);setData(next);setPending(null);
     if(body.action==='start'){setPracticing(true);setAnswer('');setFeedback('');}
     if(body.action==='hint'){elapsed.current=0;setHelpRevision(n=>n+1);}
     if(body.action==='answer'){
       const q=next.active?.questions.find(q=>q.id===body.questionId);
       const done=!!q?.done;
       if(q?.done){
         const from=equationElement.current?.getBoundingClientRect(),to=balanceElement.current?.getBoundingClientRect();
         const x=from?from.left+from.width/2:0,y=from?from.top+from.height/2:0;
         setCelebration({question:q,flight:{left:x,top:y,'--star-x':`${to?to.left+to.width/2-x:0}px`,'--star-y':`${to?to.top+to.height/2-y:0}px`} as CSSProperties});
         setAnswer(String(q.a-q.b));setReplaceAnswer(false);
       }else{setAnswer(String(body.answer));setReplaceAnswer(true);}
       setFeedback(done?'答对啦！':'再想一想，点数字可以重新填写。');
       say(done?'答对啦！':'再想一想。');elapsed.current=0;
     }
     return next;
   }catch(e){setError(e instanceof Error?e.message:'连接中断，请重试。');}
   finally{sending.current=false;setBusy(false);}
 }
 const rewardAvailable=!!data&&(data.day!==today||data.rounds<data.dailyRounds);
 return <div className="page learning-page"><div className={styles.header}><div><div className={styles.kicker}>{localize("和伙伴一起长大")}</div><h1>{localize("学习小站")}<span>{localize("。")}</span></h1></div><div className={styles.headerTools}><strong ref={balanceElement} className="learning-balance"><Star size={19}/> {data?data.balance:<span className={styles.headerPlaceholder} aria-label={localize("正在读取星星")}/>}</strong><button className="icon-button" aria-label={localize(muted?'开启学习语音':'关闭学习语音')} aria-pressed={!muted} onClick={()=>{mutedRef.current=!mutedRef.current;setMuted(mutedRef.current);stopLearningSpeech();}}>{muted?<VolumeX size={22}/>:<Volume2 size={22}/>}<span>{localize(muted?'声音关':'声音开')}</span></button></div></div>
 {data&&<p className="learning-sync" role="status">{localize(!sync.pending?'':sync.error?'记录已保存在本机，等待同步。':sync.syncing?'正在同步学习记录…':'记录已保存在本机')}{sync.error&&<button className="text-link" onClick={()=>void learningClient().flush()}>{localize("重试同步")}</button>}</p>}
 {sync.error&&!sync.pending&&<p role="alert">{localize(sync.error)}<button className="text-link" onClick={()=>void load()}>{localize("重试")}</button></p>}
 {error&&<div role="alert" className="form-error">{localize(error)}<button className="button secondary" disabled={busy} onClick={()=>pending?void act(pending):void load()}>{localize("重试")}</button>{pending&&<button className="text-link" onClick={()=>{setPending(null);void load();}}>{localize("重新读取")}</button>}</div>}
 {!data?<LearningLoading/>:practicing&&lesson&&(!lesson.finishedAt||celebration)&&question?<>
   <div className="learning-progress"><button className="back-link" disabled={busy||!!celebration} onClick={()=>{setPracticing(false);stopLearningSpeech();void learningClient().flush();}}> <ArrowLeft/>{localize("稍后继续")}</button><div className="lesson-dots" aria-label={localize(`第 ${lesson.questions.findIndex(q=>q.id===question.id)+1} 题，共 5 题`)}>{lesson.questions.map((q,i)=><span key={q.id} className={q.done?'done':q.id===question.id?'active':''}>{q.done?<Check size={18}/>:i+1}</span>)}</div>{!lesson.rewarded&&<small>{localize("自由练习 · 不增加星星")}</small>}</div>
   <div className="math-practice"><section className={`math-question${celebration?' is-correct':''}`}><div className={styles.practiceCompanion}><LearningPartner compact/><span>{localize(celebration?'做得真棒！':'我们一起想一想')}</span></div><button className="math-read" aria-label={localize("再听一次题目")} disabled={muted||!!celebration} onClick={()=>say(`${question.a}减${question.b}等于几？`)}>{muted?<VolumeX/>:<Volume2/>}</button><div ref={equationElement} className="math-equation">{localize(question.a)} − {localize(question.b)} = <output className={replaceAnswer?'needs-correction':''} aria-label={localize("你的答案")}>{localize(answer||'?')}</output></div>
   <button className="button secondary" disabled={busy||!!pending||!!celebration} onClick={()=>void act({action:'hint',lessonId:lesson.id,questionId:question.id,seconds:elapsed.current})}><Lightbulb/>{localize("帮帮我")}</button>
   {!celebration&&(question.hint||question.attempts>=2)&&<SubtractionPractice key={`${question.id}:${helpRevision}`} question={question} say={say} muted={muted}/>}
   <p className="math-feedback" role="status">{localize(feedback)}{celebration&&celebration.question.stars>0&&<strong className="answer-reward"> +{localize(celebration.question.stars)} <Star size={17} fill="currentColor" style={{display:'inline',verticalAlign:'middle'}}/></strong>}</p></section>
   <form className="math-keyboard" onSubmit={e=>{e.preventDefault();if(answer&&!celebration)void act({action:'answer',lessonId:lesson.id,questionId:question.id,answer:Number(answer),seconds:elapsed.current});}}>
   <div className="math-digits">{[1,2,3,4,5,6,7,8,9].map(n=><button type="button" key={n} disabled={busy||!!pending||!!celebration} onClick={()=>digit(n)}>{localize(n)}</button>)}<button type="button" disabled={busy||!!pending||!!celebration} aria-label={localize("清除答案")} onClick={()=>{setAnswer('');setReplaceAnswer(false);setFeedback('');}}><RotateCcw/></button><button type="button" disabled={busy||!!pending||!!celebration} onClick={()=>digit(0)}>0</button><button type="button" disabled={busy||!!pending||!!celebration} aria-label={localize("删除一位")} onClick={()=>{setAnswer(v=>v.slice(0,-1));setReplaceAnswer(false);setFeedback('');}}><X/></button></div><button className="button math-submit" disabled={!answer||Number(answer)>20||busy||!!pending||!!celebration}><Check/>{localize(celebration?'答对啦！':busy?'保存中…':'答好了')}</button></form></div>
 </>:practicing&&lesson?.finishedAt?<section className="learning-result"><div className={styles.resultCompanion}><LearningPartner compact/></div><h2>{localize("五题完成啦！")}</h2><strong className={styles.reward}>+ {localize(lesson.questions.reduce((n,q)=>n+q.stars,0))} <Star fill="currentColor" size={28}/></strong><div className="result-stars">{lesson.questions.map((q,i)=><div key={q.id}><small>{localize("第")}{localize(i+1)}{localize("题")}</small><strong className={styles.reward}>{q.stars?<>{localize(q.stars)}<Star size={18} fill="currentColor"/></>:'—'}</strong><span>{localize(q.first?'独立答对':'帮忙后答对')}</span></div>)}</div><p>{localize(sync.pending?'这轮收获 · 已保存在本机，星星同步后可兑换':'这轮收获 · 已存入星星口袋')}</p><div className="action-row"><button className="button secondary" onClick={()=>setPracticing(false)}>{localize("回学习小站")}</button><Link className="button" href="/team">{localize("去看伙伴")}</Link></div></section>:<>
 <LearningStation data={data} rewardAvailable={rewardAvailable} busy={busy||!!pending||!!celebration} onStart={()=>void act({action:'start'})}/>
 </>}{celebration&&celebration.question.stars>0&&<span aria-hidden="true" className="learning-flying-star" style={celebration.flight}><Star fill="currentColor" size={32}/></span>}</div>;
}
