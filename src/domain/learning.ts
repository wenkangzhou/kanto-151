import { learnset } from './battle-loadout';
import { usageDay } from './play-time';

export const MACHINE_STAR_COST = 30;
export const stages = [
  {name:'先从个位拿',example:'15 − 2',icon:'🍎'},
  {name:'拆十来帮忙',example:'13 − 8',icon:'🔟'},
  {name:'先拿走一整组十',example:'19 − 11',icon:'🚂'},
  {name:'混合练习',example:'20 以内减法',icon:'🌟'},
];
export type Question = {id:string;a:number;b:number;attempts:number;hint:boolean;done:boolean;first:boolean;stars:number};
export type Lesson = {id:string;day:string;stage:number;rewarded:boolean;startedAt:string;finishedAt:string|null;questions:Question[];activeSeconds:number};
export type LearningState = {
  balance:number;unlocked:string[];stage:number;fixedStage:number|null;dailyRounds:number;
  day:string;rounds:number;active:Lesson|null;history:Lesson[];
  ledger:{id:string;at:string;amount:number;reason:string}[];requests:string[];
};
export function newLearning():LearningState {return {balance:0,unlocked:[],stage:0,fixedStage:null,dailyRounds:2,day:'',rounds:0,active:null,history:[],ledger:[],requests:[]};}
export function learningState(value:Partial<LearningState>|null):LearningState {return {...newLearning(),...value};}
export function questionPool(stage:number) {
  const pool:{a:number;b:number}[]=[];
  for(let a=1;a<=20;a++)for(let b=1;b<=a;b++){
    const type=b>=10?2:(a>=10&&a%10<b)?1:0;
    if(stage===3||stage===type)pool.push({a,b});
  }
  return pool;
}
function requireInput(ok:unknown,message='操作已变化，请刷新后再试。'):asserts ok {if(!ok)throw new Error(message);}
export function changeLearning(previous:LearningState,input:Record<string,unknown>,collected:number[],parent=false,now=Date.now(),random=Math.random):LearningState {
  const s=structuredClone(previous); const at=new Date(now).toISOString();const day=usageDay(now);
  requireInput(typeof input.requestId==='string'&&input.requestId.length<=64,'请求编号不正确。');
  if(s.requests.includes(input.requestId))return s;
  if(s.day!==day){s.day=day;s.rounds=0;}
  const grant=(amount:number,reason:string)=>{s.balance+=amount;s.ledger.push({id:input.requestId as string,at,amount,reason});};
  if(input.action==='start'){
    if(!s.active||s.active.finishedAt){
      const stage=s.fixedStage??s.stage;const pool=questionPool(stage);
      // Revisit an independently missed example, then vary the remaining problems.
      const missed=s.history.slice(-3).flatMap(l=>l.questions).find(q=>!q.first&&pool.some(p=>p.a===q.a&&p.b===q.b));
      const chosen:{a:number;b:number}[]=missed?[{a:missed.a,b:missed.b}]:[];
      const remaining=pool.filter(q=>!chosen.some(p=>p.a===q.a&&p.b===q.b));
      while(chosen.length<5){const [q]=remaining.splice(Math.floor(random()*remaining.length),1);chosen.push(q);}
      const rewarded=s.rounds<s.dailyRounds;if(rewarded)s.rounds++;
      s.active={id:input.requestId,day,stage,rewarded,startedAt:at,finishedAt:null,activeSeconds:0,questions:chosen.map((q,i)=>({...q,id:`${input.requestId}:${i}`,attempts:0,hint:false,done:false,first:false,stars:0}))};
    }
  }else if(input.action==='answer'||input.action==='hint'){
    const l=s.active; requireInput(l&&l.id===input.lessonId&&!l.finishedAt);
    const q=l.questions.find(q=>!q.done);requireInput(q&&q.id===input.questionId);
    l.activeSeconds+=Math.min(120,Math.max(0,Number.isFinite(input.seconds)?Math.floor(Number(input.seconds)):0));
    if(input.action==='hint')q.hint=true;
    else{
      requireInput(Number.isInteger(input.answer)&&Number(input.answer)>=0&&Number(input.answer)<=20,'请输入 0 到 20 的答案。');
      q.attempts++;
      if(q.attempts>=2&&input.answer!==q.a-q.b)q.hint=true;
      if(input.answer===q.a-q.b){
        q.done=true;q.first=q.attempts===1&&!q.hint;q.stars=l.rewarded?(q.first?2:1):0;
        if(q.stars)grant(q.stars,q.first?'独立答对':'坚持完成');
      }
      if(l.questions.every(q=>q.done)){
        l.finishedAt=at;s.history.push(structuredClone(l));
        const recent=s.history.filter(h=>h.stage===l.stage).slice(-2);
        if(s.fixedStage===null&&recent.length===2&&recent.every(h=>h.questions.filter(q=>q.first).length>=4))s.stage=Math.min(3,s.stage+1);
      }
    }
  }else if(input.action==='unlock'){
    const id=Number(input.pokemonId),move=String(input.moveId);
    requireInput(collected.includes(id)&&learnset(id).machine.some(m=>m.id===move),'请选择伙伴能学会的技能机招式。');
    if(!s.unlocked.includes(move)){
      requireInput(s.balance>=MACHINE_STAR_COST,'还需要一些学习星。');grant(-MACHINE_STAR_COST,`解锁：${learnset(id).machine.find(m=>m.id===move)!.name}`);s.unlocked.push(move);
    }
  }else if(input.action==='settings'){
    requireInput(parent,'请先打开家长空间。');
    requireInput(Number.isInteger(input.stage)&&Number(input.stage)>=0&&Number(input.stage)<=3);
    requireInput(Number.isInteger(input.dailyRounds)&&Number(input.dailyRounds)>=0&&Number(input.dailyRounds)<=5);
    s.stage=Number(input.stage);s.fixedStage=input.fixed===true?s.stage:null;s.dailyRounds=Number(input.dailyRounds);
  }else throw new Error('没有找到这个学习操作。');
  s.requests=[...s.requests,input.requestId].slice(-200);
  return s;
}
