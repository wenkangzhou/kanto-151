export type ThinkingQuestion={id:string;kind:'pattern'|'different';sequence:number[];options:number[];target:string;groupSize:number;attempts:number;hint:boolean;done:boolean;first:boolean;stars:number};
export type ThinkingLesson={id:string;day:string;stage:number;rewarded:boolean;startedAt:string;finishedAt:string|null;questions:ThinkingQuestion[];activeSeconds:number};
export type ThinkingState={active:ThinkingLesson|null;history:ThinkingLesson[]};
export const newThinking=():ThinkingState=>({active:null,history:[]});
function shuffle<T>(values:T[],random:()=>number){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function thinkingQuestions(id:string,collected:number[],random:()=>number):ThinkingQuestion[]{
 const partners=[...new Set(collected.filter(n=>Number.isInteger(n)&&n>=1&&n<=151))];
 const pool=partners.length>=2?partners:[-1,-2,-3];
 return Array.from({length:5},(_,i)=>{
  const [a,b]=shuffle(pool,random);const kind=i%2===0?'pattern':'different';
  if(kind==='different'){
   const odd=Math.floor(random()*4),options=Array.from({length:4},(_,n)=>n===odd?b:a);
   return {id:`${id}:${i}`,kind,sequence:[],options,target:String(odd),groupSize:0,attempts:0,hint:false,done:false,first:false,stars:0};
  }
  const group=i===0?[a,b]:i===2?[a,a,b]:[a,b,b];
  const sequence=[...group,...group].slice(0,-1),options=shuffle([a,b],random);
  return {id:`${id}:${i}`,kind,sequence,options,target:String(options.indexOf(group[group.length-1])),groupSize:group.length,attempts:0,hint:false,done:false,first:false,stars:0};
 });
}
