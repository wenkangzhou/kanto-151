'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Lightbulb,Play,Star,Volume2,VolumeX} from 'lucide-react';
import {learningClient} from '@/lib/learning-client';
import {type LearningView} from '@/lib/learning-session';
import {speakLearning,stopLearningSpeech} from '@/lib/learning-speech';
import {pokemonById} from '@/domain/pokemon';
import {thinkingStages,thinkingThemePool,type ThinkingQuestion} from '@/domain/thinking';
import {useCollection} from './collection-provider';
import {ThinkingIcon} from './thinking-icon';
import {BallArt} from './ball-art';
import {encyclopediaBalls} from '@/domain/encyclopedia';
import {PokemonArt} from './pokemon-art';
import {LearningLoading,LearningPartner} from './learning-station';
import styles from './thinking-learning.module.css';
function Picture({id}:{id:number}){
 if(id<=-4&&id>=-6)return <BallArt ball={encyclopediaBalls[-id-4]}/>;
 const pokemon=pokemonById.get(id);
 if(pokemon)return <PokemonArt pokemon={pokemon}/>;
 return <svg viewBox="0 0 100 100" role="img" aria-label={id===-1?'红色圆形':id===-2?'蓝色方形':'黄色三角形'}>{id===-1?<circle cx="50" cy="50" r="32" fill="#e88072"/>:id===-2?<rect x="20" y="20" width="60" height="60" rx="9" fill="#76a8c5"/>:<path d="M50 15 88 82H12Z" fill="#e2bd59"/>}</svg>;
}
function Mark({value}:{value:string}){return <span className={styles.mark} aria-label={value==='star'?'星形标记':'圆形标记'}>{value==='star'?<Star size={23} fill="currentColor"/>:<span className={styles.circle}/>}</span>;}
function hintText(q:ThinkingQuestion){return q.kind==='dual'?'先看伙伴怎样轮流，再看标记怎样重复，两样都要对。':q.kind==='matrix'?'每一行都有同样三位伙伴，看看下一行怎样换位置。':q.kind==='pattern'?'看看每一组，是不是一样的顺序？':q.marks?'看看伙伴角落的标记，哪个形状不同？':'先找出一样的，再看看哪一个不同。';}
export function ThinkingLearning(){
 const {snapshot}=useCollection();
 const [previewA,previewB]=thinkingThemePool(snapshot.records.map(r=>r.pokemonId));
 const [view,setView]=useState<LearningView>(()=>typeof window==='undefined'?{data:null,pending:0,syncing:false,error:''}:learningClient().getSnapshot());
 const [practicing,setPracticing]=useState(false),[busy,setBusy]=useState(false),[muted,setMuted]=useState(false),[error,setError]=useState(''),[wrong,setWrong]=useState('');
 const [celebration,setCelebration]=useState<ThinkingQuestion|null>(null);
 const seconds=useRef(0),requestId=useRef<string|null>(null),sending=useRef(false);
 const data=view.data,lesson=data?.thinking?.active,question=celebration??lesson?.questions.find(q=>!q.done),questionId=question?.id;
 useEffect(()=>{const client=learningClient();const unsub=client.subscribe(()=>setView(client.getSnapshot()));void client.load();return()=>{unsub();void client.flush();stopLearningSpeech();};},[]);
 useEffect(()=>{seconds.current=0;if(!practicing||!questionId)return;const timer=setInterval(()=>{if(!document.hidden)seconds.current++;},1000);return()=>clearInterval(timer);},[practicing,questionId]);
 useEffect(()=>{if(!celebration)return;const timer=setTimeout(()=>{setCelebration(null);setWrong('');},1200);return()=>clearTimeout(timer);},[celebration]);
 function say(text:string){if(!muted)speakLearning(text);}
 async function start(){if(sending.current)return;sending.current=true;setBusy(true);setError('');requestId.current??=crypto.randomUUID();try{await learningClient().start({action:'start',subject:'thinking',requestId:requestId.current});requestId.current=null;setPracticing(true);setWrong('');}catch(e){setError(e instanceof Error?e.message:'暂时无法开始，请重试。');}finally{sending.current=false;setBusy(false);}}
 function act(action:'answer'|'hint',answer?:string){if(!lesson||!question||celebration||sending.current)return;setError('');sending.current=true;try{const next=learningClient().apply({action,subject:'thinking',answer,requestId:crypto.randomUUID(),lessonId:lesson.id,questionId:question.id,seconds:seconds.current});seconds.current=0;const q=next.thinking!.active!.questions.find(q=>q.id===question.id)!;if(action==='hint')say(hintText(q));else if(q.done){setCelebration(q);setWrong('');say('答对啦！');}else{setWrong(answer??'');say('再仔细看看，试一次。');}}catch(e){setError(e instanceof Error?e.message:'记录没能保存，请重试。');}finally{sending.current=false;}}
 const stage=lesson&&!lesson.finishedAt?lesson.stage:data?.thinking?.fixedStage??data?.thinking?.stage??0;
 const finished=practicing&&lesson?.finishedAt&&!celebration;
 return <div className={`page ${styles.page}`}><Link className="back-link" href="/learn"><ArrowLeft size={18}/>学习小站</Link>
 <header className={styles.header}><div><small>和伙伴一起，发现小秘密</small><h1>思维小站<span>。</span></h1></div><div className={styles.tools}><strong><Star size={20}/>{data?.balance??'—'}</strong><button aria-label={muted?'开启思维声音':'关闭思维声音'} aria-pressed={!muted} onClick={()=>{setMuted(!muted);stopLearningSpeech();}}>{muted?<VolumeX size={22}/>:<Volume2 size={22}/>}</button></div></header>
 {(error||view.error)&&<p className="form-error" role="alert">{error||view.error}<button className="text-link" onClick={()=>void learningClient().load()}>重试同步</button></p>}
 {view.pending>0&&<p className={styles.note} role="status">记录已保存在本机{view.error?'，等待同步':''}</p>}
 {!data?<LearningLoading/>:finished?<section className={styles.result}><LearningPartner compact/><h2>五个小发现，完成啦！</h2><strong className={styles.earned}>+{lesson.questions.reduce((n,q)=>n+q.stars,0)}<Star/></strong><div className={styles.results}>{lesson.questions.map((q,i)=><div key={q.id}><Check size={22}/><b>第 {i+1} 题</b><small>{q.first?'独立答对':q.hint?'提示后完成':'自己改对'}</small></div>)}</div><p className={styles.note}>{view.pending?'星星同步后可兑换':lesson.rewarded?'星星已存入口袋':'自由练习完成啦'}</p><Link href="/learn" className="button">回学习小站<ArrowRight size={18}/></Link></section>:practicing&&question?<>
 <div className={styles.progress}><button className="back-link" disabled={!!celebration} onClick={()=>{setPracticing(false);stopLearningSpeech();void learningClient().flush();}}><ArrowLeft size={18}/>稍后继续</button><div className="lesson-dots" aria-label={`第 ${lesson!.questions.findIndex(q=>q.id===question.id)+1} 题，共 5 题`}>{lesson!.questions.map((q,i)=><span key={q.id} className={q.done?'done':q.id===question.id?'active':''}>{q.done?<Check size={16}/>:i+1}</span>)}</div></div>
 <section className={styles.activity}><div className={styles.activityHeading}><LearningPartner compact/><h2>{question.kind==='dual'?'伙伴和标记，一起找':question.kind==='matrix'?'看看行和列，补上空位':question.kind==='pattern'?'空位里，是谁？':'谁和大家不一样？'}</h2><button className={styles.speaker} disabled={muted} aria-label="听题目" onClick={()=>say(question.kind==='different'?'找一找，谁和大家不一样？':question.kind==='dual'?'看看伙伴和标记的顺序，选出两样都对的图片。':'看一看排列的顺序，空位里应该是谁？')}><Volume2 size={22}/></button></div>
 {(question.kind==='dual'||question.kind==='matrix')&&<div className={`${styles.challenge} ${question.kind==='matrix'?styles.matrix:styles.dual} ${question.hint?styles.guided:''}`} aria-label={question.kind==='matrix'?'三行三列图阵':'从左到右观察伙伴和标记'}>{question.sequence.map((id,i)=><div key={i} className={styles.tile}>{id===0?<span className={styles.missing}>?</span>:<><Picture id={id}/>{question.sequenceMarks?.[i]&&<Mark value={question.sequenceMarks[i]}/>}</>}</div>)}</div>}
 {question.kind==='dual'&&<p className={styles.scrollHint}>左右滑动，看完整个队伍</p>}
 {question.kind==='dual'&&question.hint&&<div className={styles.clueTracks}><div><small>只看伙伴</small>{question.sequence.map((id,i)=><span key={i}>{id?<Picture id={id}/>:<b>?</b>}</span>)}</div><div><small>只看标记</small>{question.sequenceMarks!.map((mark,i)=><span key={i}>{mark?<Mark value={mark}/>:<b>?</b>}</span>)}</div></div>}
 {question.kind==='pattern'&&<div className={`${styles.sequence} ${question.hint?styles.grouped:''}`}>{Array.from({length:2},(_,group)=><div key={group} className={styles.group}>{Array.from({length:question.groupSize},(_,n)=>{const i=group*question.groupSize+n;return <div className={styles.tile} key={n}>{i!==(question.blankIndex??question.sequence.length)&&i<question.sequence.length?<Picture id={question.sequence[i]}/>:<span className={styles.missing}>?</span>}</div>;})}</div>)}</div>}
 {question.kind==='different'&&!question.marks&&question.hint&&<div className={styles.sequence} aria-label="先看看这两个相同的伙伴"><div className={`${styles.group} ${styles.example}`}>{[0,1].map(i=><div className={styles.tile} key={i}><Picture id={question.options.find((id)=>question.options.filter(x=>x===id).length>1)!}/></div>)}</div></div>}
 <div className={`${styles.options} ${question.kind==='different'?`${styles.odd} ${question.options.length>4?styles.six:''}`:question.kind==='dual'?styles.dualOptions:''}`}>{question.options.map((id,i)=><button key={i} aria-label={`选择第 ${i+1} 张图片`} disabled={!!celebration} className={`${wrong===String(i)?styles.wrong:''} ${celebration&&question.target===String(i)?styles.correct:''}`} onClick={()=>act('answer',String(i))}><Picture id={id}/>{question.marks&&<Mark value={question.marks[i]}/>}{celebration&&question.target===String(i)&&<Check className={styles.check} size={24}/>}</button>)}</div>
 <p className={styles.feedback} role="status">{celebration?`答对啦！${celebration.stars?` +${celebration.stars} 星`:''}`:wrong?'再仔细看看，试一次。':question.hint?hintText(question):' '}</p>
 {!celebration&&<button className="button secondary" onClick={()=>act('hint')}><Lightbulb size={18}/>帮帮我</button>}{!lesson!.rewarded&&<p className={styles.note}>自由练习</p>}</section></>:<><section className={styles.hero}><div><small>思维 · 观察与规律</small><h2>睁大眼睛，<br/>发现伙伴的小秘密。</h2><p>{thinkingStages[stage]}</p><button className="button" disabled={busy} onClick={()=>void start()}><Play size={18}/>{busy?'正在准备…':lesson&&!lesson.finishedAt?'继续这五题':'开始五个小活动'}<ArrowRight size={18}/></button><p className={styles.note}>{lesson&&!lesson.finishedAt?`已完成 ${lesson.questions.filter(q=>q.done).length} / 5`:'各科共用每日奖励轮数，用完后可自由练习'}</p></div><LearningPartner/></section><div className={styles.preview}><div><span><Picture id={previewA}/><Picture id={previewB}/><Picture id={previewA}/><b>?</b></span><h3>找规律</h3><p>看顺序，接着排</p></div><div><span><Picture id={previewA}/><Picture id={previewA}/><Picture id={previewB}/></span><h3>找不同</h3><p>找出不一样的那个</p></div></div><p className={styles.note}><span className={styles.noteIcon}><ThinkingIcon/></span>伙伴、精灵球和小图形，轮流来玩。</p></>}
 </div>;
}
