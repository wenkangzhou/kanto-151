'use client';
import { useT } from '@/lib/i18n/locale';

import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useId,useState} from 'react';
import {ArrowLeft,ArrowRight,Gamepad2,Hand,Tv,Volume2} from 'lucide-react';
import {gymNarration,kantoGyms,orderedGyms,type GymMode} from '@/domain/gyms';
import {pokemonById} from '@/domain/pokemon';
import {speakText,stopVoice} from '@/lib/voice-audio';
import {GymBadgeArt} from './gym-badge-art';
import {PokemonArt} from './pokemon-art';
import {ReadAloud} from './read-aloud';
import {TypePicture} from './type-badge';

export function GymTopicCard(){
  const localize = useT();
 return <article className="encyclopedia-topic gym-topic"><Link href="/pokedex/encyclopedia/gyms" className="ball-topic-link" aria-label={localize("认识关都道馆和徽章")}><div className="gym-topic-art">{orderedGyms('anime').map(gym=><GymBadgeArt key={gym.id} gym={gym}/>)}</div><div className="ball-topic-caption"><div><span>{localize("道馆和徽章")}</span><h2>{localize("跟着徽章，认识馆主")}</h2></div><span className="topic-enter"><Hand size={24}/><ArrowRight size={26}/></span></div></Link></article>;
}
export function GymEncyclopedia(){
  const localize = useT();
 const [mode,setMode]=useState<GymMode>('anime');
 const [selected,setSelected]=useState('brock');
 const owner=useId();
 useEffect(()=>()=>stopVoice(owner),[owner]);
 const gyms=orderedGyms(mode);
 const gym=kantoGyms.find(item=>item.id===selected)!;
 const index=gyms.findIndex(item=>item.id===selected);
 const team=mode==='anime'?gym.animeTeam:gym.gameTeam;
 const narration=gymNarration(gym,mode);
 const select=(id:string,nextMode=mode)=>{
  stopVoice();setSelected(id);setMode(nextMode);
  speakText(owner,gymNarration(kantoGyms.find(item=>item.id===id)!,nextMode),{systemFallback:true});
 };
 return <div className="page encyclopedia-page gym-page">
  <Link className="back-link" href="/pokedex/encyclopedia"><ArrowLeft size={20}/>{localize("小百科")}</Link>
  <div className="page-heading"><div><div className="eyebrow">{localize("KANTO · 八枚徽章")}</div><h1>{localize("道馆和徽章")}</h1></div></div>
  <div className="gym-mode" role="group" aria-label={localize("选择动画或游戏资料")}><button aria-pressed={mode==='anime'} onClick={()=>select(selected,'anime')}><Tv size={22}/>{localize("动画故事")}</button><button aria-pressed={mode==='game'} onClick={()=>select(selected,'game')}><Gamepad2 size={22}/>{localize("游戏道馆")}</button></div>
  <p className="gym-order-label">{localize(mode==='anime'?'跟着小智拿徽章的顺序':'《火红／叶绿》· 按徽章排列')}</p>
  <nav className="gym-badge-route" aria-label={localize("选择道馆")}>{gyms.map((item,i)=><button key={item.id} aria-pressed={selected===item.id} aria-label={localize(`第${i+1}站，${item.name}，${item.badge}`)} onClick={()=>select(item.id)}><span className="gym-stop-number">{localize(String(i+1).padStart(2,'0'))}</span><GymBadgeArt gym={item}/><strong>{localize(item.name.replace('道馆',''))}</strong></button>)}</nav>
  <section className="gym-detail" aria-label={localize(`${gym.name}介绍`)}>
   <div className="gym-detail-hero">
    <div className="gym-leader"><div className="gym-leader-picture"><Image src={`/encyclopedia/leaders/${gym.id}.png`} alt={localize(gym.leader)} width={160} height={160} unoptimized/></div><span>{localize("馆主")}</span><h2>{localize(gym.leader)}</h2><TypePicture type={gym.type} interactive={false}/></div>
    <div className="gym-detail-title"><span className="gym-story-kicker">{localize("第")}{localize(index+1)}{localize("站 ·")}{localize(mode==='anime'?'动画无印篇':'火红／叶绿')}</span><h2>{localize(gym.name)}<ReadAloud key={`${gym.id}-${mode}`} text={localize(narration)} systemFallback label={localize(`听听${gym.name}的故事`)}/></h2><p>{localize(mode==='anime'?gym.animeStory:gym.gameStory)}</p></div>
    <button className="gym-featured-badge" aria-label={localize(`听听${gym.badge}`)} onClick={()=>{stopVoice();speakText(owner,gym.badge,{systemFallback:true});}}><GymBadgeArt gym={gym}/><strong>{localize(gym.badge)}</strong><Volume2 size={18}/></button>
   </div>
   <div className="gym-pokemon-section"><h3>{localize(mode==='game'?'馆主的出战队伍':gym.id==='giovanni'?'借给火箭队的宝可梦':'动画里出场的宝可梦')}</h3><div className="gym-pokemon-list">{team.map((id,i)=>{const pokemon=pokemonById.get(id)!;return <div className="gym-pokemon-card" key={`${id}-${i}`}><PokemonArt pokemon={pokemon} hidden/><span>{localize(pokemon.name)}</span></div>;})}</div>{mode==='anime'&&gym.animeTeamNote&&<p className="gym-team-note">{localize(gym.animeTeamNote)}</p>}</div>
  </section>
  <div className="gym-pagination"><button className="button button-secondary" disabled={index===0} onClick={()=>select(gyms[index-1].id)}><ArrowLeft size={18}/>{localize("上一站")}</button><span>{localize(index+1)} / 8</span><button className="button button-secondary" disabled={index===7} onClick={()=>select(gyms[index+1].id)}>{localize("下一站")}<ArrowRight size={18}/></button></div>
  <details className="encyclopedia-notes"><summary>{localize("给家长看的资料说明")}</summary><p>{localize("本篇介绍关都的八座经典道馆。动画按小智在无印篇拿到徽章的顺序排列，并不表示动画中的关都只有八座道馆。游戏馆主与徽章承袭《红／绿／蓝》，队伍采用《火红／叶绿》的首次道馆战；实际挑战顺序并非完全固定，不混入《皮卡丘》版或后续世代。")}</p><p>{localize("馆主图片使用《火红／叶绿》游戏像素形象，动画造型可能不同。徽章图片采用用户提供的参考图。宝可梦仅以剪影介绍，不会解锁图鉴；动画列表只涉及对应道馆故事，并非馆主全部持有宝可梦。百科没有答题或奖励。")}</p><a href={`https://bulbapedia.bulbagarden.net/wiki/${gym.source}`} target="_blank" rel="noreferrer">{localize(gym.name)}{localize("动画与游戏资料 ↗")}</a><a href="https://pokemondb.net/firered-leafgreen/gymleaders-elitefour" target="_blank" rel="noreferrer">{localize("火红／叶绿队伍资料 ↗")}</a><a href="https://www.serebii.net/fireredleafgreen/gyms.shtml" target="_blank" rel="noreferrer">{localize("馆主图片来源 ↗")}</a><a href="https://wiki.52poke.com/wiki/徽章" target="_blank" rel="noreferrer">{localize("徽章图片来源 ↗")}</a></details>
 </div>;
}
