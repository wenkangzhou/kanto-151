/** Append-only stages preserve saved lessons; use complete Mandarin syllables. */
export const pinyinItems = [
  {id:'ma1',text:'mā',initial:'m',final:'ā',finalAudio:'a1',word:'妈妈',picture:'mother'},
  {id:'mi3',text:'mǐ',initial:'m',final:'ǐ',finalAudio:'yi3',word:'米',picture:'rice'},
  {id:'mu4',text:'mù',initial:'m',final:'ù',finalAudio:'wu4',word:'木',picture:'tree'},
  {id:'ba1',text:'bā',initial:'b',final:'ā',finalAudio:'a1',word:'八',picture:'eight'},
  {id:'bi3',text:'bǐ',initial:'b',final:'ǐ',finalAudio:'yi3',word:'笔',picture:'pencil'},
  {id:'bu4',text:'bù',initial:'b',final:'ù',finalAudio:'wu4',word:'布',picture:'cloth'},
  {id:'da4',text:'dà',initial:'d',final:'à',finalAudio:'a4',word:'大',picture:'big'},
  {id:'di2',text:'dí',initial:'d',final:'í',finalAudio:'yi2',word:'笛',picture:'flute'},
  {id:'du4',text:'dù',initial:'d',final:'ù',finalAudio:'wu4',word:'肚子',picture:'belly'},
  {id:'ta3',text:'tǎ',initial:'t',final:'ǎ',finalAudio:'a3',word:'塔',picture:'tower'},
  {id:'ti1',text:'tī',initial:'t',final:'ī',finalAudio:'yi1',word:'梯子',picture:'ladder'},
  {id:'tu4',text:'tù',initial:'t',final:'ù',finalAudio:'wu4',word:'兔',picture:'rabbit'},
  {id:'la4',text:'là',initial:'l',final:'à',finalAudio:'a4',word:'蜡烛',picture:'candle'},
  {id:'li2',text:'lí',initial:'l',final:'í',finalAudio:'yi2',word:'梨',picture:'pear'},
  {id:'lu4',text:'lù',initial:'l',final:'ù',finalAudio:'wu4',word:'鹿',picture:'deer'},
] as const;
export type PinyinId=typeof pinyinItems[number]['id'];
export type PinyinItem=typeof pinyinItems[number];
export const pinyinById=new Map<string,PinyinItem>(pinyinItems.map(item=>[item.id,item]));
export const pinyinStages=['认识 m 的三个音节','认识 b 的三个音节','六个音节一起练','认识 d 的三个音节','认识 t 的三个音节','复习 m、b、d、t','认识 l 的三个音节','十五个音节一起练'];
export const pinyinInitialAudio={m:'mo1',b:'bo1',d:'de1',t:'te1',l:'le1'} as const;
const stageInitials:readonly (readonly PinyinItem['initial'][])[]=[['m'],['b'],['m','b'],['d'],['t'],['m','b','d','t'],['l'],['m','b','d','t','l']];
export const pinyinAudioIds=new Set<string>([...Object.values(pinyinInitialAudio),...pinyinItems.flatMap(item=>[item.id,item.finalAudio])]);
export type PinyinQuestion={id:string;kind:'listen'|'picture'|'blend';target:PinyinId;options:PinyinId[];attempts:number;hint:boolean;done:boolean;first:boolean;stars:number};
export type PinyinLesson={id:string;day:string;stage:number;rewarded:boolean;startedAt:string;finishedAt:string|null;questions:PinyinQuestion[];activeSeconds:number};
export type PinyinState={stage:number;fixedStage:number|null;active:PinyinLesson|null;history:PinyinLesson[]};
export const newPinyin=():PinyinState=>({stage:0,fixedStage:null,active:null,history:[]});
export function pinyinPool(stage:number){const initials=stageInitials[stage]??stageInitials[0];return pinyinItems.filter(item=>initials.includes(item.initial));}
function shuffle<T>(items:readonly T[],random:()=>number){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function pinyinQuestions(stage:number,lessonId:string,random:()=>number):PinyinQuestion[]{
 const pool=shuffle(pinyinPool(stage),random);
 const kinds=['listen','picture','blend','listen','picture'] as const;
 return kinds.map((kind,i)=>{
  const target=pool[i%pool.length];
  const others=shuffle(pool.filter(item=>item.id!==target.id),random).slice(0,2);
  return {id:`${lessonId}:${i}`,kind,target:target.id,options:shuffle([target,...others],random).map(item=>item.id),attempts:0,hint:false,done:false,first:false,stars:0};
 });
}
