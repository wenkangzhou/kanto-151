// Editorial scope is explicit: these are the five balls introduced in Generation I,
// not a count of every ball obtainable via later games or trades.
export const encyclopediaBalls = [
 {id:'poke',name:'精灵球',color:'#ed554b',clue:'红红的上半边',description:'这是最常见的精灵球。训练家用它来尝试捕捉野生宝可梦，和新伙伴一起旅行。',pokemon:[16,19,25]},
 {id:'great',name:'超级球',color:'#4285cf',clue:'蓝色球盖，红色条纹',description:'超级球比普通精灵球更容易捕捉到野生宝可梦。不过，投出去也不一定就能成功哦。',pokemon:[54,61,58]},
 {id:'ultra',name:'高级球',color:'#d2a330',clue:'黑色球盖，黄色条纹',description:'高级球通常比超级球更容易捕捉到野生宝可梦。它的黑色和黄色花纹很好认。',pokemon:[143,132,131]},
 {id:'master',name:'大师球',color:'#9770cb',clue:'紫色球盖，上面有个 M',description:'大师球非常珍贵。野外遇到的任何宝可梦，它都能保证捕获成功！就算是传说中的宝可梦，也一定能抓到！',pokemon:[150,144,145]},
 {id:'safari',name:'狩猎球',color:'#92a570',clue:'绿色球盖，迷彩花纹',description:'狩猎球是在狩猎地带使用的特别精灵球。在那里，训练家用它来尝试结识野生宝可梦。',pokemon:[128,111,115]},
] as const;
export type EncyclopediaBall = typeof encyclopediaBalls[number];

export const ballNarration = (ball: EncyclopediaBall) => `${ball.name}。${ball.clue}。${ball.description}`;
