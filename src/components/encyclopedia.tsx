'use client';
import Link from 'next/link';
import {useEffect,useId,useState} from 'react';
import {ArrowLeft,ArrowRight,Hand,Volume2} from 'lucide-react';
import {encyclopediaBalls,ballNarration} from '@/domain/encyclopedia';
import {pokemonById} from '@/domain/pokemon';
import {speakText,stopVoice} from '@/lib/voice-audio';
import {BallArt} from './ball-art';
import {KnowledgeTabs} from './knowledge-tabs';
import {ReadAloud} from './read-aloud';
import {PokemonArt} from './pokemon-art';
export function Encyclopedia(){
 return <div className="page encyclopedia-page"><KnowledgeTabs encyclopedia/><div className="page-heading"><div><div className="eyebrow">KANTO · 小小发现</div><h1>宝可梦百科<span className="title-dot">.</span></h1></div></div><article className="encyclopedia-topic"><Link href="/pokedex/encyclopedia/poke-balls" className="ball-topic-link" aria-label="看看五种精灵球"><div className="ball-topic-art">{encyclopediaBalls.map(ball=><BallArt key={ball.id} ball={ball}/>)}</div><div className="ball-topic-caption"><div><span>认识精灵球</span><h2>哪颗球，你见过？</h2></div><span className="topic-enter"><Hand size={24}/><ArrowRight size={26}/></span></div></Link></article></div>;
}
export function PokeBallArticle(){
 const [selected,setSelected]=useState(0);const owner=useId();
 useEffect(()=>()=>stopVoice(owner),[owner]);
 const ball=encyclopediaBalls[selected];
 const narration=ballNarration(ball);
 return <div className="page encyclopedia-page ball-article"><Link className="back-link" href="/pokedex/encyclopedia"><ArrowLeft size={20}/>小百科</Link><div className="page-heading"><div><div className="eyebrow">关都 · 第一世代游戏</div><h1>认识五种精灵球</h1></div></div><div className="ball-choices" role="group" aria-label="选择精灵球，听介绍">{encyclopediaBalls.map((item,index)=><button key={item.id} aria-pressed={selected===index} aria-label={`认识${item.name}`} onClick={()=>{setSelected(index);stopVoice(owner);speakText(owner,ballNarration(item),{systemFallback:true});}}><BallArt ball={item}/><span>{item.name}</span><Volume2 size={16}/></button>)}</div><section className={`ball-story ball-story-${ball.id}`} aria-label={ball.name}><div className="ball-story-illustration"><button className="ball-story-play" aria-label={`听听${ball.name}`} onClick={()=>{stopVoice(owner);speakText(owner,narration,{systemFallback:true});}}><BallArt ball={ball}/></button><div className="ball-scene" aria-hidden="true">{ball.pokemon.map(id=><PokemonArt key={id} hidden pokemon={pokemonById.get(id)!}/>)}</div></div><div className="ball-story-copy"><span className="ball-story-number">0{selected+1} / 05</span><h2>{ball.name}<ReadAloud key={ball.id} systemFallback text={narration} label={`再听一次${ball.name}的介绍`}/></h2><strong>{ball.clue}</strong><p>{ball.description}</p></div></section><details className="encyclopedia-notes"><summary>给家长看的资料说明</summary><p>本篇介绍第一世代引入的五种球，不代表整个宝可梦系列只有五种。《火红／叶绿》与其他作品的交换带入情况不计入本篇。场景伙伴为示意，不表示必须使用这种球才能捕捉，也不代表本应用已提供这些道具。</p><p>插图为本应用绘制的简化示意。讲解使用预先制作的中文语音。</p><a href="https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9_Ball" target="_blank" rel="noreferrer">精灵球种类资料 ↗</a><a href="https://www.pokemon.com/uk/pokemon-news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-kanto-region" target="_blank" rel="noreferrer">官方关都回顾：狩猎地带 ↗</a></details></div>;
}
