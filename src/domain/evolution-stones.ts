import {pokemonById} from './pokemon';
export type EvolutionStone={id:string;name:string;color:string;light:string;description:string;pairs:readonly (readonly [number,number])[]};
// Kanto 001–151 only; evolution conditions are from FireRed/LeafGreen.
export const evolutionStones:readonly EvolutionStone[]=[
 {id:'fire',name:'火之石',color:'#ce7445',light:'#fff0db',description:'像藏着一团小火焰。给合适的伙伴使用，就能帮助它进化。',pairs:[[37,38],[58,59],[133,136]]},
 {id:'water',name:'水之石',color:'#4a9dba',light:'#eaf6fa',description:'像一滴清亮的水。它能帮助下面这些伙伴进化，不是所有水属性伙伴都需要它。',pairs:[[61,62],[90,91],[120,121],[133,134]]},
 {id:'thunder',name:'雷之石',color:'#a5943b',light:'#fff8db',description:'里面有闪电一样的花纹。皮卡丘和伊布，都能借助它的力量进化。',pairs:[[25,26],[133,135]]},
 {id:'leaf',name:'叶之石',color:'#698f51',light:'#eff6e7',description:'里面像藏着一片叶子。臭臭花、口呆花和蛋蛋，都能用它进化。',pairs:[[44,45],[70,71],[102,103]]},
 {id:'moon',name:'月之石',color:'#7c809b',light:'#f1f0f8',description:'这是一块神秘的石头。不是到了晚上就会进化，要把月之石用在合适的伙伴身上。',pairs:[[30,31],[33,34],[35,36],[39,40]]},
];
export function stoneNarration(stone:EvolutionStone){return `${stone.name}。${stone.description}在火红和叶绿游戏里，${stone.pairs.map(([from,to])=>`${pokemonById.get(from)!.name}使用${stone.name}，进化成${pokemonById.get(to)!.name}`).join('。')}。`;}
