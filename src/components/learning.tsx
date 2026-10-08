'use client';
import Link from 'next/link';
import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowLeft,BookOpen,Check,ChevronRight,GraduationCap,Lightbulb,RotateCcw,Star,Volume2,VolumeX,X} from 'lucide-react';
import {api} from '@/lib/api-client';
import {MACHINE_STAR_COST,stages,type LearningState,type Question} from '@/domain/learning';
import {usageDay} from '@/domain/play-time';
import {SubtractionPractice} from './subtraction-practice';
import {speakLearning,stopLearningSpeech} from '@/lib/learning-speech';

export function Learning(){
 const [data,setData]=useState<LearningState|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[practicing,setPracticing]=useState(false),[answer,setAnswer]=useState(''),[feedback,setFeedback]=useState(''),[muted,setMuted]=useState(false);
 const [celebration,setCelebration]=useState<{question:Question;flight:CSSProperties}|null>(null);
 const balanceElement=useRef<HTMLElement>(null),equationElement=useRef<HTMLDivElement>(null);
 const [replaceAnswer,setReplaceAnswer]=useState(false);
 const [helpRevision,setHelpRevision]=useState(0);
 const [pending,setPending]=useState<Record<string,unknown>|null>(null);
 const [today,setToday]=useState(()=>usageDay(Date.now()));
 const mutedRef=useRef(false);
 const sending=useRef(false),elapsed=useRef(0),ticking=useRef(0);
 const load=useCallback(async()=>{try{setData(await api<LearningState>('learning'));setError('');}catch(e){setError(e instanceof Error?e.message:'请重新连接。');}},[]);
 useEffect(()=>{let mounted=true;api<LearningState>('learning').then(d=>{if(mounted)setData(d);}).catch(e=>{if(mounted)setError(e.message);});const tick=setInterval(()=>setToday(usageDay(Date.now())),15000);return()=>{mounted=false;clearInterval(tick);stopLearningSpeech();};},[]);
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
     const next=await api<LearningState>('learning',body);setData(next);setPending(null);
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
 return <div className="page learning-page"><div className="section-heading"><h1><GraduationCap/>去学习</h1><div className="action-row"><strong ref={balanceElement} className="learning-balance"><Star/> {data?.balance??0}</strong><button className="icon-button" aria-label={muted?'开启学习语音':'关闭学习语音'} aria-pressed={!muted} onClick={()=>{mutedRef.current=!mutedRef.current;setMuted(mutedRef.current);stopLearningSpeech();}}>{muted?<VolumeX size={22}/>:<Volume2 size={22}/>}<span>{muted?'声音关':'声音开'}</span></button></div></div>
 {error&&<div role="alert" className="form-error">{error}<button className="button secondary" disabled={busy} onClick={()=>pending?void act(pending):void load()}>重试</button>{pending&&<button className="text-link" onClick={()=>{setPending(null);void load();}}>重新读取</button>}</div>}
 {!data?<p role="status">正在打开学习手帐…</p>:practicing&&lesson&&(!lesson.finishedAt||celebration)&&question?<>
   <div className="learning-progress"><button className="back-link" disabled={busy||!!celebration} onClick={()=>{setPracticing(false);stopLearningSpeech();}}> <ArrowLeft/>稍后继续</button><div className="lesson-dots" aria-label={`第 ${lesson.questions.findIndex(q=>q.id===question.id)+1} 题，共 5 题`}>{lesson.questions.map((q,i)=><span key={q.id} className={q.done?'done':q.id===question.id?'active':''}>{q.done?<Check size={18}/>:i+1}</span>)}</div>{!lesson.rewarded&&<small>自由练习 · 不增加星星</small>}</div>
   <div className="math-practice"><section className={`math-question${celebration?' is-correct':''}`}><button className="math-read" aria-label="再听一次题目" disabled={muted||!!celebration} onClick={()=>say(`${question.a}减${question.b}等于几？`)}>{muted?<VolumeX/>:<Volume2/>}</button><div ref={equationElement} className="math-equation">{question.a} − {question.b} = <output className={replaceAnswer?'needs-correction':''} aria-label="你的答案">{answer||'?'}</output></div>
   <button className="button secondary" disabled={busy||!!pending||!!celebration} onClick={()=>void act({action:'hint',lessonId:lesson.id,questionId:question.id,seconds:elapsed.current})}><Lightbulb/>帮帮我</button>
   {!celebration&&(question.hint||question.attempts>=2)&&<SubtractionPractice key={`${question.id}:${helpRevision}`} question={question} say={say} muted={muted}/>}
   <p className="math-feedback" role="status">{feedback}{celebration&&celebration.question.stars>0&&<strong className="answer-reward"> +{celebration.question.stars} ⭐</strong>}</p></section>
   <form className="math-keyboard" onSubmit={e=>{e.preventDefault();if(answer&&!celebration)void act({action:'answer',lessonId:lesson.id,questionId:question.id,answer:Number(answer),seconds:elapsed.current});}}>
   <div className="math-digits">{[1,2,3,4,5,6,7,8,9].map(n=><button type="button" key={n} disabled={busy||!!pending||!!celebration} onClick={()=>digit(n)}>{n}</button>)}<button type="button" disabled={busy||!!pending||!!celebration} aria-label="清除答案" onClick={()=>{setAnswer('');setReplaceAnswer(false);setFeedback('');}}><RotateCcw/></button><button type="button" disabled={busy||!!pending||!!celebration} onClick={()=>digit(0)}>0</button><button type="button" disabled={busy||!!pending||!!celebration} aria-label="删除一位" onClick={()=>{setAnswer(v=>v.slice(0,-1));setReplaceAnswer(false);setFeedback('');}}><X/></button></div><button className="button math-submit" disabled={!answer||Number(answer)>20||busy||!!pending||!!celebration}><Check/>{celebration?'答对啦！':busy?'保存中…':'答好了'}</button></form></div>
 </>:practicing&&lesson?.finishedAt?<section className="learning-result"><div className="learning-celebration">🌟</div><h2>五题完成啦！</h2><strong>+ {lesson.questions.reduce((n,q)=>n+q.stars,0)} ⭐</strong><div className="result-stars">{lesson.questions.map((q,i)=><div key={q.id}><small>第 {i+1} 题</small><strong>{q.stars?`${q.stars} ⭐`:'—'}</strong><span>{q.first?'独立答对':'帮忙后答对'}</span></div>)}</div><p>这轮收获 · 已存入星星口袋</p><div className="action-row"><button className="button secondary" onClick={()=>setPracticing(false)}>回学习小站</button><Link className="button" href="/team">去看伙伴</Link></div></section>:<>
 <div className="learning-wallet"><div><span className="eyebrow">我的星星口袋</span><h2>一点点学，慢慢攒。</h2><p>每 {MACHINE_STAR_COST} 颗星，兑换一个喜欢的招式。</p></div><Link className="button secondary" href="/learn/moves"><Star size={20}/>去兑换<ChevronRight size={18}/></Link></div><div className="learning-subjects"><button className="subject-math" disabled={busy||!!pending||!!celebration} onClick={()=>void act({action:'start'})}><span>🔢</span><h2>数学</h2><p>{stages[data.fixedStage??data.stage].name}</p><strong>{lesson&&!lesson.finishedAt?'继续这五题':rewardAvailable?'开始五题':'自由练习' } <ChevronRight/></strong><small>{lesson&&!lesson.finishedAt?`${lesson.questions.filter(q=>q.done).length} / 5 已完成`:rewardAvailable?'完成练习，收集学习星':'今天的奖励轮次已用完，本轮不增加星星'}</small></button>{[{icon:'📖',name:'语文'},{icon:'🧩',name:'思维'},{icon:'🔤',name:'英语'}].map(s=><div className="subject-coming" key={s.name} aria-label={`${s.name}，建设中`}><span>{s.icon}</span><h2>{s.name}</h2><small>建设中</small></div>)}</div>
 <div className="learning-path">{stages.map((s,i)=><div key={s.name} className={i===(data.fixedStage??data.stage)?'current':''}><span>{s.icon}</span><strong>{s.name}</strong><small>{s.example}</small></div>)}</div><Link href="/learn/moves" className="text-link"><BookOpen size={18}/>看看招式兑换</Link>
 </>}{celebration&&celebration.question.stars>0&&<span aria-hidden="true" className="learning-flying-star" style={celebration.flight}><Star fill="currentColor" size={32}/></span>}</div>;
}
