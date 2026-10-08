'use client';
import {useState} from 'react';
import {ArrowLeft,Check,ChevronRight,RotateCcw,Volume2,VolumeX,X} from 'lucide-react';
import {subtractionHelp} from '@/domain/subtraction-help';
import type {Question} from '@/domain/learning';

export function SubtractionPractice({question:q,say,muted}:{question:Question;say:(text:string)=>void;muted:boolean}){
 const steps=subtractionHelp(q.a,q.b);
 const [step,setStep]=useState(0),[removed,setRemoved]=useState<string[]>([]),[done,setDone]=useState(false),[closed,setClosed]=useState(false);
 const current=steps[Math.min(step,steps.length-1)];
 const needed=current.groups.reduce((sum,g)=>sum+g.removed,0);
 const ready=removed.length===needed;
 const wholeTen=q.b>=10&&step===1;
 const combining=step>0&&needed===0&&q.b<10;
 const instruction=step===0?(q.a>=10?`点一下${q.a}，拆出十。`:`点一下${q.a}，摆出圆点。`):wholeTen?'点一下十格，拿走一整组十。':combining?'把两边剩下的圆点合起来。':ready?'拿够啦，数一数还剩几个。':`点掉${needed}个圆点。`;
 function restart(){setStep(0);setRemoved([]);setDone(false);setClosed(false);say(q.a>=10?`点一下${q.a}，拆出十。`:`点一下${q.a}，摆出圆点。`);}
 function advance(){
   if(step===0){setStep(1);setRemoved([]);say(`${steps[0].speech} ${q.b>=10?'先拿走一整组十。':`点掉${q.b}个圆点。`}`);return;}
   if(!ready)return;
   if(step===steps.length-1){setDone(true);say(current.speech);return;}
   setStep(step+1);setRemoved([]);say(steps[step+1].groups.some(g=>g.removed)?`再点掉${q.b-10}个圆点。`:'把剩下的圆点合起来。');
 }
 function take(group:number,index:number){
   const key=`${group}:${index}`,limit=current.groups[group].removed;
   if(!limit||removed.includes(key)||ready)return;
   setRemoved(old=>old.includes(key)||old.filter(k=>k.startsWith(`${group}:`)).length>=limit?old:[...old,key]);
 }
 if(closed)return <button className="text-link help-reopen" onClick={restart}><RotateCcw size={16}/>再帮我一次</button>;
 return <div className="subtraction-help interactive-help">
  <div className="help-heading"><strong>{done?'数一数，还剩几个？':current.title}</strong><button aria-label="读出这一步" disabled={muted} onClick={()=>say(done?current.speech:instruction)}>{muted?<VolumeX size={20}/>:<Volume2 size={20}/>}</button></div>
  {step===0?<button className="split-number" onClick={advance} aria-label={q.a>=10?`把${q.a}拆成十和${q.a-10}`:`摆出${q.a}个圆点`}><strong>{q.a}</strong><span>{q.a>=10?'拆出十':'摆出来'}<ChevronRight size={20}/></span></button>:<>
   <div className="help-decomposition">{steps[0].equation.split('；').map(line=><span key={line}>{line}</span>)}</div>
   <div className="help-equation">{done?current.equation:current.equation.split(' = ')[0]+' = ?'}</div>
   {done?<div className="merged-counters" aria-label={`还剩${q.a-q.b}个圆点`}>{Array.from({length:q.a-q.b},(_,i)=><span key={i}/>)}{q.a===q.b&&<strong>0</strong>}</div>:<div className="help-groups">{current.groups.map((group,i)=>{
    const count=removed.filter(k=>k.startsWith(`${i}:`)).length;
    const contents=<><div className="help-counters">{Array.from({length:group.total},(_,n)=>{
     const key=`${i}:${n}`,gone=removed.includes(key);
     return wholeTen||!group.removed?<span key={key} className={gone?'removed':''}>{gone?<X size={14}/>:null}</span>:<button key={key} className={gone?'removed':''} aria-label={`拿走第${i+1}组第${n+1}个圆点`} disabled={gone||count>=group.removed} onClick={()=>take(i,n)}>{gone?<X size={14}/>:null}</button>;
    })}</div><strong>{count?`剩 ${group.total-count}`:group.total}</strong></>;
    return wholeTen&&group.removed===10?<button className="help-group take-ten" key={i} disabled={ready} aria-label="拿走一整组十" onClick={()=>{setRemoved(Array.from({length:10},(_,n)=>`${i}:${n}`));say('十拿走了。');}}>{contents}</button>:<div className="help-group" key={i}>{contents}</div>;
   })}</div>}
   {!done&&<p className="help-count" role="status">{combining?'合起来数一数':needed===0?'不用再拿圆点了':wholeTen?(ready?'十拿走了':'点十格，拿走十'):<>已拿走 <b>{removed.length} / {needed}</b></>}</p>}
  </>}
  <div className="help-controls"><button onClick={restart} disabled={step===0}><RotateCcw size={16}/>重来</button>{done?<button className="button secondary" onClick={()=>{setClosed(true);say('现在自己填一填答案吧。');}}><Check size={18}/>我来填答案</button>:step>0?<button className="button secondary" disabled={!ready} onClick={advance}>{combining?'合起来':step===steps.length-1?'数一数':'下一步'}<ChevronRight size={18}/></button>:<span><ArrowLeft size={14}/>点上面的数字</span>}</div>
 </div>;
}
