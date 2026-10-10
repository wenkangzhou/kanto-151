import {pokemonById} from './pokemon';
import {TYPE_NAMES, type PokemonType} from './types';
export type GymMode = 'anime' | 'game';
export type KantoGym = {
 id:string; name:string; leader:string; type:PokemonType; badge:string; color:string;
 animeOrder:number; gameOrder:number; gameTeam:number[]; animeTeam:number[];
 gameStory:string; animeStory:string; animeTeamNote?:string; source:string;
};
// Game rosters are the initial FireRed/LeafGreen Gym battles, including repeated species.
export const kantoGyms: KantoGym[] = [
 {id:'brock',name:'深灰道馆',leader:'小刚',type:'rock',badge:'深灰徽章',color:'#8a958c',animeOrder:1,gameOrder:1,gameTeam:[74,95],animeTeam:[74,95],gameStory:'岩石场地里，小刚和小拳石、大岩蛇等着挑战者。在游戏里，战胜他就能拿到深灰徽章。',animeStory:'小智的第一场道馆挑战就在这里！小刚看到了小智对宝可梦的关心，把深灰徽章交给他，后来还和他一起旅行。',source:'Pewter_Gym'},
 {id:'misty',name:'华蓝道馆',leader:'小霞',type:'water',badge:'蓝色徽章',color:'#58add2',animeOrder:2,gameOrder:2,gameTeam:[120,121],animeTeam:[120,121],gameStory:'道馆里有大水池。小霞使用海星星和宝石海星，战胜她就能拿到水滴形的蓝色徽章。',animeStory:'动画里，小霞和三位姐姐都与这座道馆有关。小霞和小智的对战被火箭队打断，小智保护了道馆里的宝可梦，姐姐们送给他蓝色徽章。',source:'Cerulean_Gym'},
 {id:'surge',name:'枯叶道馆',leader:'马志士',type:'electric',badge:'橙色徽章',color:'#d7a448',animeOrder:3,gameOrder:3,gameTeam:[100,25,26],animeTeam:[26],gameStory:'要找到机关开关，才能走到马志士面前。他擅长电属性，雷丘是他的得力伙伴。获胜后能得到橙色徽章。',animeStory:'皮卡丘第一次输给了雷丘，却没有选择进化。小智和皮卡丘一起想办法，靠灵活的动作在再次挑战时获胜，拿到了橙色徽章。',source:'Vermilion_Gym'},
 {id:'erika',name:'玉虹道馆',leader:'莉佳',type:'grass',badge:'彩虹徽章',color:'#86a76a',animeOrder:5,gameOrder:4,gameTeam:[71,114,45],animeTeam:[114,70,44],gameStory:'这里有许多植物。莉佳擅长草属性，使用大食花、蔓藤怪和霸王花。战胜她就能拿到花朵形的彩虹徽章。',animeStory:'莉佳的道馆像一座温室。对战途中发生火灾，小智救出了臭臭花。莉佳感谢他的勇敢，把彩虹徽章送给了他。',source:'Celadon_Gym'},
 {id:'koga',name:'浅红道馆',leader:'阿桔',type:'poison',badge:'粉红徽章',color:'#bf84b1',animeOrder:6,gameOrder:5,gameTeam:[109,89,109,110],animeTeam:[48,49,42],animeTeamNote:'毛球在这场挑战中进化成摩鲁蛾。',gameStory:'阿桔是一位忍者。游戏里的道馆有看不见的墙，要像走迷宫一样找到他。战胜他的毒属性队伍，可以获得粉红徽章。',animeStory:'这是一座藏着机关的忍者道馆！阿桔的毛球在挑战中进化成摩鲁蛾。小智后来用小火龙战胜大嘴蝠，得到了粉红徽章。',source:'Fuchsia_Gym'},
 {id:'sabrina',name:'金黄道馆',leader:'娜姿',type:'psychic',badge:'金色徽章',color:'#cca950',animeOrder:4,gameOrder:6,gameTeam:[64,122,49,65],animeTeam:[63,64],animeTeamNote:'凯西在挑战中进化成勇基拉。',gameStory:'道馆里有许多传送地板。娜姿擅长超能力，不过她的游戏队伍里也有虫和毒属性的摩鲁蛾。战胜她可以得到金色徽章。',animeStory:'娜姿的凯西在挑战中进化成勇基拉，让小智吃了苦头。后来鬼斯通把娜姿逗笑了，勇基拉也笑得无法对战，小智因此拿到了金色徽章。',source:'Saffron_Gym'},
 {id:'blaine',name:'红莲道馆',leader:'夏伯',type:'fire',badge:'深红徽章',color:'#d37e5e',animeOrder:7,gameOrder:7,gameTeam:[58,77,78,59],animeTeam:[38,112,126],gameStory:'夏伯喜欢出谜题。他的游戏队伍有卡蒂狗、小火马、烈焰马和风速狗。战胜他可以得到像火焰一样的深红徽章。',animeStory:'动画里的道馆藏在火山里。夏伯使用九尾、钻角犀兽和鸭嘴火兽。再次挑战时，小智的喷火龙战胜了鸭嘴火兽，赢得深红徽章。',source:'Cinnabar_Gym'},
 {id:'giovanni',name:'常青道馆',leader:'坂木',type:'ground',badge:'绿色徽章',color:'#70a185',animeOrder:8,gameOrder:8,gameTeam:[111,51,31,34,111],animeTeam:[112,68,99],animeTeamNote:'这里展示坂木借给火箭队三人组的三只宝可梦，不是坂木的全部伙伴。',gameStory:'坂木也是火箭队的首领。游戏里，他使用地面属性队伍。拿到另外七枚徽章后，再来挑战他，获胜就能得到绿色徽章。',animeStory:'小智来挑战时，坂木不在，由火箭队三人组代管道馆。他们使用坂木借出的宝可梦迎战。小智战胜他们，拿到了第八枚绿色徽章。',source:'Viridian_Gym'},
];
export function orderedGyms(mode:GymMode){return [...kantoGyms].sort((a,b)=>a[`${mode}Order`]-b[`${mode}Order`]);}
export function gymNarration(gym:KantoGym,mode:GymMode){
 const team=mode==='game'?gym.gameTeam:gym.animeTeam;
 const names=team.map(id=>pokemonById.get(id)!.name).join('、');
 return `${gym.name}。馆主是${gym.leader}，擅长${TYPE_NAMES[gym.type]}属性。这里的徽章叫${gym.badge}。${mode==='game'?'在火红和叶绿游戏里':'在动画故事里'}，${mode==='game'?gym.gameStory:gym.animeStory}${gym.id==='giovanni'&&mode==='anime'?'借出的宝可梦':'这里介绍的宝可梦'}有${names}。${mode==='anime'?(gym.animeTeamNote??''):''}`;
}
