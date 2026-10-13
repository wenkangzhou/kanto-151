export const thinkingStages=['发现规律','三位伙伴排排队','补空与细节观察'];
export type ThinkingQuestion={id:string;kind:'pattern'|'different';sequence:number[];options:number[];target:string;groupSize:number;blankIndex?:number;marks?:string[];attempts:number;hint:boolean;done:boolean;first:boolean;stars:number};
export type ThinkingLesson={id:string;day:string;stage:number;rewarded:boolean;startedAt:string;finishedAt:string|null;questions:ThinkingQuestion[];activeSeconds:number};
export type ThinkingState={stage?:number;fixedStage?:number|null;active:ThinkingLesson|null;history:ThinkingLesson[]};
export const newThinking=():ThinkingState=>({stage:0,fixedStage:null,active:null,history:[]});
function shuffle<T>(values:T[],random:()=>number){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/** Keep unseen Pokémon hidden; Poké Balls fill any missing picture choices. */
export function thinkingThemePool(collected:number[]){
 const partners=[...new Set(collected.filter(n=>Number.isInteger(n)&&n>=1&&n<=151))];
 return partners.length>=3?partners:[...partners,...[-4,-5,-6].slice(0,3-partners.length)];
}
export function thinkingQuestions(id:string,collected:number[],random:()=>number,stage=0):ThinkingQuestion[]{
 const themed=thinkingThemePool(collected);
 const themes=shuffle([true,true,true,false,false],random);
 return Array.from({length:5},(_,i)=>{
  const [a,b,c]=shuffle(themes[i]?themed:[-1,-2,-3],random);const kind=i%2===0?'pattern':'different';
  if(kind==='different'){
   const count=stage===0?4:6,odd=Math.floor(random()*count),detail=stage===2;
   const options=Array.from({length:count},(_,n)=>detail?a:n===odd?b:a);
   const usual=random()<.5?'star':'circle',different=usual==='star'?'circle':'star';
   const marks=detail?Array.from({length:count},(_,n)=>n===odd?different:usual):undefined;
   return {id:`${id}:${i}`,kind,sequence:[],options,target:String(odd),marks,groupSize:0,attempts:0,hint:false,done:false,first:false,stars:0};
  }
  const group=stage===0?(i===0?[a,b]:i===2?[a,a,b]:[a,b,b]):(i===0?[a,b,c]:i===2?[a,b,a,c]:[a,a,b,c]);
  const full=[...group,...group];
  const blankIndex=stage===2?group.length+Math.floor(random()*group.length):full.length-1;
  const target=full[blankIndex],sequence=full.map((id,i)=>i===blankIndex?0:id),options=shuffle(stage===0?[a,b]:[a,b,c],random);
  return {id:`${id}:${i}`,kind,sequence,blankIndex,options,target:String(options.indexOf(target)),groupSize:group.length,attempts:0,hint:false,done:false,first:false,stars:0};
 });
}
