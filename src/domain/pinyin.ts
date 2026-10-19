/** Stage IDs and existing item IDs are append-only to preserve saved lessons. */
export type PinyinItem={id:string;text:string;initial:string;final:string;finalAudio?:string;word:string;picture?:string;whole?:boolean};
export const pinyinInitialAudio:Readonly<Record<string,string>>={"m": "mo1", "b": "bo1", "d": "de1", "t": "te1", "l": "le1", "p": "po1", "f": "fo1", "n": "ne1", "g": "ge1", "k": "ke1", "h": "he1", "j": "ji1", "q": "qi1", "x": "xi1", "zh": "zhi1", "ch": "chi1", "sh": "shi1", "r": "ri4", "z": "zi1", "c": "ci1", "s": "si1", "y": "yi1", "w": "wu1"};
const originalItems = [
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
const additionalItems:readonly PinyinItem[]=[
  {"id":"pa2","text":"pá","initial":"p","final":"á","word":"爬","finalAudio":"a2"},
  {"id":"pi2","text":"pí","initial":"p","final":"í","word":"皮","finalAudio":"yi2"},
  {"id":"pu2","text":"pú","initial":"p","final":"ú","word":"葡萄","finalAudio":"wu2"},
  {"id":"fa1","text":"fā","initial":"f","final":"ā","word":"发芽","finalAudio":"a1"},
  {"id":"fo2","text":"fó","initial":"f","final":"ó","word":"佛像"},
  {"id":"fu3","text":"fǔ","initial":"f","final":"ǔ","word":"斧子","finalAudio":"wu3"},
  {"id":"na2","text":"ná","initial":"n","final":"á","word":"拿","finalAudio":"a2"},
  {"id":"ni2","text":"ní","initial":"n","final":"í","word":"泥","finalAudio":"yi2"},
  {"id":"nu4","text":"nù","initial":"n","final":"ù","word":"怒","finalAudio":"wu4"},
  {"id":"ge1","text":"gē","initial":"g","final":"ē","word":"鸽子","finalAudio":"e1"},
  {"id":"gu1","text":"gū","initial":"g","final":"ū","word":"菇","finalAudio":"wu1"},
  {"id":"gua1","text":"guā","initial":"g","final":"uā","word":"瓜"},
  {"id":"ke2","text":"ké","initial":"k","final":"é","word":"壳","finalAudio":"e2","picture":"symbol:shell"},
  {"id":"ku1","text":"kū","initial":"k","final":"ū","word":"哭","finalAudio":"wu1"},
  {"id":"kua1","text":"kuā","initial":"k","final":"uā","word":"夸奖"},
  {"id":"he2","text":"hé","initial":"h","final":"é","word":"河","finalAudio":"e2"},
  {"id":"hu2","text":"hú","initial":"h","final":"ú","word":"壶","finalAudio":"wu2"},
  {"id":"hua1","text":"huā","initial":"h","final":"uā","word":"花","picture":"symbol:flower"},
  {"id":"ji1","text":"jī","initial":"j","final":"ī","word":"鸡","finalAudio":"yi1"},
  {"id":"jia1","text":"jiā","initial":"j","final":"iā","word":"家","picture":"symbol:house"},
  {"id":"ju2","text":"jú","initial":"j","final":"ǘ","word":"橘子","finalAudio":"yu2"},
  {"id":"qi1","text":"qī","initial":"q","final":"ī","word":"七","finalAudio":"yi1","picture":"symbol:seven"},
  {"id":"qia4","text":"qià","initial":"q","final":"ià","word":"恰好"},
  {"id":"qu4","text":"qù","initial":"q","final":"ǜ","word":"去","finalAudio":"yu4"},
  {"id":"xi1","text":"xī","initial":"x","final":"ī","word":"西瓜","finalAudio":"yi1"},
  {"id":"xia1","text":"xiā","initial":"x","final":"iā","word":"虾"},
  {"id":"xu1","text":"xū","initial":"x","final":"ǖ","word":"须","finalAudio":"yu1"},
  {"id":"zha1","text":"zhā","initial":"zh","final":"ā","word":"扎针","finalAudio":"a1"},
  {"id":"zhe1","text":"zhē","initial":"zh","final":"ē","word":"遮阳","finalAudio":"e1"},
  {"id":"zhu1","text":"zhū","initial":"zh","final":"ū","word":"猪","finalAudio":"wu1","picture":"symbol:pig"},
  {"id":"cha2","text":"chá","initial":"ch","final":"á","word":"茶","finalAudio":"a2","picture":"symbol:cup"},
  {"id":"che1","text":"chē","initial":"ch","final":"ē","word":"车","finalAudio":"e1","picture":"symbol:car"},
  {"id":"chu2","text":"chú","initial":"ch","final":"ú","word":"厨房","finalAudio":"wu2"},
  {"id":"sha1","text":"shā","initial":"sh","final":"ā","word":"沙","finalAudio":"a1"},
  {"id":"she2","text":"shé","initial":"sh","final":"é","word":"蛇","finalAudio":"e2"},
  {"id":"shu1","text":"shū","initial":"sh","final":"ū","word":"书","finalAudio":"wu1","picture":"symbol:book"},
  {"id":"re4","text":"rè","initial":"r","final":"è","word":"热","finalAudio":"e4"},
  {"id":"ru2","text":"rú","initial":"r","final":"ú","word":"如果","finalAudio":"wu2"},
  {"id":"ren2","text":"rén","initial":"r","final":"én","word":"人","picture":"symbol:person"},
  {"id":"za2","text":"zá","initial":"z","final":"á","word":"砸","finalAudio":"a2"},
  {"id":"ze2","text":"zé","initial":"z","final":"é","word":"责任","finalAudio":"e2"},
  {"id":"zu2","text":"zú","initial":"z","final":"ú","word":"足","finalAudio":"wu2"},
  {"id":"ca1","text":"cā","initial":"c","final":"ā","word":"擦","finalAudio":"a1","picture":"symbol:eraser"},
  {"id":"ce4","text":"cè","initial":"c","final":"è","word":"侧面","finalAudio":"e4"},
  {"id":"cu4","text":"cù","initial":"c","final":"ù","word":"醋","finalAudio":"wu4"},
  {"id":"sa3","text":"sǎ","initial":"s","final":"ǎ","word":"撒种","finalAudio":"a3"},
  {"id":"se4","text":"sè","initial":"s","final":"è","word":"色","finalAudio":"e4"},
  {"id":"su4","text":"sù","initial":"s","final":"ù","word":"速度","finalAudio":"wu4"},
  {"id":"ya1","text":"yā","initial":"y","final":"ā","word":"鸭"},
  {"id":"wa1","text":"wā","initial":"w","final":"ā","word":"蛙"},
  {"id":"wo1","text":"wō","initial":"w","final":"ō","word":"窝"},
  {"id":"bai2","text":"bái","initial":"b","final":"ái","word":"白"},
  {"id":"bei1","text":"bēi","initial":"b","final":"ēi","word":"杯","picture":"symbol:cup"},
  {"id":"mao1","text":"māo","initial":"m","final":"āo","word":"猫","picture":"symbol:cat"},
  {"id":"gou3","text":"gǒu","initial":"g","final":"ǒu","word":"狗","picture":"symbol:dog"},
  {"id":"niu2","text":"niú","initial":"n","final":"iú","word":"牛"},
  {"id":"shui3","text":"shuǐ","initial":"sh","final":"uǐ","word":"水","picture":"symbol:water"},
  {"id":"jie3","text":"jiě","initial":"j","final":"iě","word":"姐姐"},
  {"id":"xue3","text":"xuě","initial":"x","final":"üě","word":"雪","picture":"symbol:snow"},
  {"id":"ban1","text":"bān","initial":"b","final":"ān","word":"班级"},
  {"id":"ben3","text":"běn","initial":"b","final":"ěn","word":"本子"},
  {"id":"lin2","text":"lín","initial":"l","final":"ín","word":"林","picture":"symbol:trees"},
  {"id":"dun4","text":"dùn","initial":"d","final":"ùn","word":"盾","picture":"symbol:shield"},
  {"id":"qun2","text":"qún","initial":"q","final":"ǘn","word":"裙"},
  {"id":"yang2","text":"yáng","initial":"y","final":"áng","word":"羊"},
  {"id":"deng1","text":"dēng","initial":"d","final":"ēng","word":"灯","picture":"symbol:lamp"},
  {"id":"xing1","text":"xīng","initial":"x","final":"īng","word":"星","picture":"symbol:star"},
  {"id":"dong1","text":"dōng","initial":"d","final":"ōng","word":"冬","picture":"symbol:snow"},
  {"id":"zhi1","text":"zhī","initial":"zh","final":"ī","word":"蜘蛛","whole":true,"picture":"symbol:spider"},
  {"id":"chi1","text":"chī","initial":"ch","final":"ī","word":"吃","whole":true},
  {"id":"shi2","text":"shí","initial":"sh","final":"í","word":"石","whole":true},
  {"id":"ri4","text":"rì","initial":"r","final":"ì","word":"日","whole":true,"picture":"symbol:sun"},
  {"id":"zi3","text":"zǐ","initial":"z","final":"ǐ","word":"紫","whole":true,"picture":"symbol:purple"},
  {"id":"ci4","text":"cì","initial":"c","final":"ì","word":"刺","whole":true},
  {"id":"si4","text":"sì","initial":"s","final":"ì","word":"四","whole":true,"picture":"symbol:four"},
  {"id":"yi1","text":"yī","initial":"y","final":"ī","word":"衣","whole":true,"picture":"symbol:shirt"},
  {"id":"wu1","text":"wū","initial":"w","final":"ū","word":"屋","whole":true,"picture":"symbol:house"},
  {"id":"yu2","text":"yú","initial":"y","final":"ǘ","word":"鱼","whole":true,"picture":"symbol:fish"},
  {"id":"ye4","text":"yè","initial":"y","final":"è","word":"叶","whole":true,"picture":"symbol:leaf"},
  {"id":"yue4","text":"yuè","initial":"y","final":"üè","word":"月","whole":true,"picture":"symbol:moon"},
  {"id":"yuan2","text":"yuán","initial":"y","final":"üán","word":"圆","whole":true,"picture":"symbol:circle"},
  {"id":"yin1","text":"yīn","initial":"y","final":"īn","word":"音乐","whole":true,"picture":"symbol:music"},
  {"id":"yun2","text":"yún","initial":"y","final":"ǘn","word":"云","whole":true,"picture":"symbol:cloud"},
  {"id":"ying1","text":"yīng","initial":"y","final":"īng","word":"鹰","whole":true},
  {"id":"e2","text":"é","initial":"","final":"é","word":"鹅"},
  {"id":"er3","text":"ěr","initial":"","final":"ěr","word":"耳","picture":"symbol:ear"},
  {"id":"ou3","text":"ǒu","initial":"","final":"ǒu","word":"藕"},
  {"id":"ma2","text":"má","initial":"m","final":"á","word":"麻","finalAudio":"a2"},
  {"id":"ma3","text":"mǎ","initial":"m","final":"ǎ","word":"马","finalAudio":"a3"},
  {"id":"ma4","text":"mà","initial":"m","final":"à","word":"骂","finalAudio":"a4"}
];
export const pinyinItems:readonly PinyinItem[]=[...originalItems,...additionalItems];
export type PinyinId=string;
export const pinyinById=new Map<string,PinyinItem>(pinyinItems.map(item=>[item.id,item]));
export const pinyinStageDefinitions=[
  {"name":"认识 m 的三个音节","items":["ma1","mi3","mu4"]},
  {"name":"认识 b 的三个音节","items":["ba1","bi3","bu4"]},
  {"name":"六个音节一起练","items":["ma1","mi3","mu4","ba1","bi3","bu4"]},
  {"name":"认识 d 的三个音节","items":["da4","di2","du4"]},
  {"name":"认识 t 的三个音节","items":["ta3","ti1","tu4"]},
  {"name":"复习 m、b、d、t","items":["ma1","mi3","mu4","ba1","bi3","bu4","da4","di2","du4","ta3","ti1","tu4"]},
  {"name":"认识 l 的三个音节","items":["la4","li2","lu4"]},
  {"name":"十五个音节一起练","items":["ma1","mi3","mu4","ba1","bi3","bu4","da4","di2","du4","ta3","ti1","tu4","la4","li2","lu4"]},
  {"name":"认识 p 的常用音节","items":["pa2","pi2","pu2"]},
  {"name":"认识 f 的常用音节","items":["fa1","fo2","fu3"]},
  {"name":"认识 n 的常用音节","items":["na2","ni2","nu4"]},
  {"name":"认识 g 的常用音节","items":["ge1","gu1","gua1"]},
  {"name":"认识 k 的常用音节","items":["ke2","ku1","kua1"]},
  {"name":"认识 h 的常用音节","items":["he2","hu2","hua1"]},
  {"name":"认识 j 的常用音节","items":["ji1","jia1","ju2"]},
  {"name":"认识 q 的常用音节","items":["qi1","qia4","qu4"]},
  {"name":"认识 x 的常用音节","items":["xi1","xia1","xu1"]},
  {"name":"认识 zh 的常用音节","items":["zha1","zhe1","zhu1"]},
  {"name":"认识 ch 的常用音节","items":["cha2","che1","chu2"]},
  {"name":"认识 sh 的常用音节","items":["sha1","she2","shu1"]},
  {"name":"认识 r 的常用音节","items":["re4","ru2","ren2"]},
  {"name":"认识 z 的常用音节","items":["za2","ze2","zu2"]},
  {"name":"认识 c 的常用音节","items":["ca1","ce4","cu4"]},
  {"name":"认识 s 的常用音节","items":["sa3","se4","su4"]},
  {"name":"认识 y、w 的音节","items":["ya1","wa1","wo1"]},
  {"name":"复韵母 ai、ei、ao、ou","items":["bai2","bei1","mao1","gou3"]},
  {"name":"复韵母 iu、ui、ie、üe","items":["niu2","shui3","jie3","xue3"]},
  {"name":"前鼻韵母 an、en、in、un、ün","items":["ban1","ben3","lin2","dun4","qun2"]},
  {"name":"后鼻韵母 ang、eng、ing、ong","items":["yang2","deng1","xing1","dong1"]},
  {"name":"整体认读 zhi、chi、shi、ri","items":["zhi1","chi1","shi2","ri4"]},
  {"name":"整体认读 zi、ci、si","items":["zi3","ci4","si4"]},
  {"name":"整体认读 yi、wu、yu","items":["yi1","wu1","yu2"]},
  {"name":"整体认读 ye、yue、yuan","items":["ye4","yue4","yuan2"]},
  {"name":"整体认读 yin、yun、ying","items":["yin1","yun2","ying1"]},
  {"name":"单独成音节 e、er、ou","items":["e2","er3","ou3"]},
  {"name":"听清四声 mā、má、mǎ、mà","items":["ma1","ma2","ma3","ma4"]},
  {"name":"综合复习","items":["pa2","pi2","pu2","fa1","fo2","fu3","na2","ni2","nu4","ge1","gu1","gua1","ke2","ku1","kua1","he2","hu2","hua1","ji1","jia1","ju2","qi1","qia4","qu4","xi1","xia1","xu1","zha1","zhe1","zhu1","cha2","che1","chu2","sha1","she2","shu1","re4","ru2","ren2","za2","ze2","zu2","ca1","ce4","cu4","sa3","se4","su4","ya1","wa1","wo1","bai2","bei1","mao1","gou3","niu2","shui3","jie3","xue3","ban1","ben3","lin2","dun4","qun2","yang2","deng1","xing1","dong1","zhi1","chi1","shi2","ri4","zi3","ci4","si4","yi1","wu1","yu2","ye4","yue4","yuan2","yin1","yun2","ying1","e2","er3","ou3","ma2","ma3","ma1","mi3","mu4","ba1","bi3","bu4","da4","di2","du4","ta3","ti1","tu4","la4","li2","lu4"]}
] as const;
export const pinyinStages=pinyinStageDefinitions.map(stage=>stage.name);
export const pinyinFinalExamples=[{"text": "a", "example": "ma1"}, {"text": "o", "example": "fo2"}, {"text": "e", "example": "e2"}, {"text": "i", "example": "mi3"}, {"text": "u", "example": "mu4"}, {"text": "ü", "example": "yu2"}, {"text": "ai", "example": "bai2"}, {"text": "ei", "example": "bei1"}, {"text": "ui", "example": "shui3"}, {"text": "ao", "example": "mao1"}, {"text": "ou", "example": "gou3"}, {"text": "iu", "example": "niu2"}, {"text": "ie", "example": "jie3"}, {"text": "üe", "example": "xue3"}, {"text": "er", "example": "er3"}, {"text": "an", "example": "ban1"}, {"text": "en", "example": "ben3"}, {"text": "in", "example": "lin2"}, {"text": "un", "example": "dun4"}, {"text": "ün", "example": "qun2"}, {"text": "ang", "example": "yang2"}, {"text": "eng", "example": "deng1"}, {"text": "ing", "example": "xing1"}, {"text": "ong", "example": "dong1"}] as const;
export const pinyinWholeIds=["zhi1", "chi1", "shi2", "ri4", "zi3", "ci4", "si4", "yi1", "wu1", "yu2", "ye4", "yue4", "yuan2", "yin1", "yun2", "ying1"] as const;
export const pinyinAudioIds=new Set<string>([...Object.values(pinyinInitialAudio),'a1','a2','a3','a4','yi1','wu1',...pinyinItems.flatMap(item=>[item.id,...(item.finalAudio?[item.finalAudio]:[])])]);
export type PinyinQuestion={id:string;kind:'listen'|'picture'|'blend';target:PinyinId;options:PinyinId[];attempts:number;hint:boolean;done:boolean;first:boolean;stars:number};
export type PinyinLesson={id:string;day:string;stage:number;rewarded:boolean;startedAt:string;finishedAt:string|null;questions:PinyinQuestion[];activeSeconds:number};
export type PinyinState={stage:number;fixedStage:number|null;active:PinyinLesson|null;history:PinyinLesson[]};
export const newPinyin=():PinyinState=>({stage:0,fixedStage:null,active:null,history:[]});
export function pinyinPool(stage:number):PinyinItem[]{const entry=pinyinStageDefinitions[stage]??pinyinStageDefinitions[0];return entry.items.map(id=>pinyinById.get(id)!);}
export function pinyinParts(item:PinyinItem):{label:string;audio:string}[]{
 if(item.whole||!item.initial)return [];
 const threePart=/^([iu])([āáǎà])$/.exec(item.final);
 if(threePart){const tones:Record<string,string>={ā:'a1',á:'a2',ǎ:'a3',à:'a4'};return [{label:item.initial,audio:pinyinInitialAudio[item.initial]},{label:threePart[1],audio:threePart[1]==='i'?'yi1':'wu1'},{label:threePart[2],audio:tones[threePart[2]]}];}
 if(!item.finalAudio)return [];
 const audio=pinyinInitialAudio[item.initial];
 return audio?[{label:item.initial,audio},{label:item.final,audio:item.finalAudio}]:[];
}
function shuffle<T>(items:readonly T[],random:()=>number){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function pinyinQuestions(stage:number,lessonId:string,random:()=>number):PinyinQuestion[]{
 const pool=shuffle(pinyinPool(stage),random);
 const kinds=['listen','picture','blend','listen','picture'] as const;
 return kinds.map((kind,i)=>{
  const target=pool[i%pool.length];
  const activity=kind==='picture'&&!target.picture?'listen':kind==='blend'&&!pinyinParts(target).length?'listen':kind;
  const others=shuffle(pool.filter(item=>item.id!==target.id&&(activity!=='picture'||item.picture!==target.picture)),random).slice(0,2);
  return {id:`${lessonId}:${i}`,kind:activity,target:target.id,options:shuffle([target,...others],random).map(item=>item.id),attempts:0,hint:false,done:false,first:false,stars:0};
 });
}
