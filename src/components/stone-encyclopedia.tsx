'use client';
import Link from 'next/link';
import {useEffect,useId,useState,type CSSProperties} from 'react';
import {ArrowLeft,ArrowRight,Hand,Tv} from 'lucide-react';
import {evolutionStones,stoneNarration} from '@/domain/evolution-stones';
import {pokemonById} from '@/domain/pokemon';
import {speakText,stopVoice} from '@/lib/voice-audio';
import {StoneArt} from './stone-art';
import {PokemonArt} from './pokemon-art';
import {ReadAloud} from './read-aloud';
import styles from './stone-encyclopedia.module.css';
export function StoneTopicCard(){return <article className={`encyclopedia-topic ${styles.topic}`}><Link href="/pokedex/encyclopedia/evolution-stones" className="ball-topic-link" aria-label="认识进化石，看看伙伴怎样进化"><div className={styles.topicArt}>{evolutionStones.map(stone=><StoneArt key={stone.id} stone={stone}/>)}</div><div className="ball-topic-caption"><div><span>认识进化石</span><h2>小小石头，让伙伴大变身</h2></div><span className="topic-enter"><Hand size={24}/><ArrowRight size={26}/></span></div></Link></article>;}
export function StoneEncyclopedia(){
 const [selected,setSelected]=useState(0);const owner=useId();
 useEffect(()=>()=>stopVoice(owner),[owner]);
 const stone=evolutionStones[selected];
 return <div className="page encyclopedia-page"><Link className="back-link" href="/pokedex/encyclopedia"><ArrowLeft size={20}/>小百科</Link><div className="page-heading"><div><div className="eyebrow">关都 · 火红／叶绿</div><h1>神奇的进化石</h1></div></div>
 <nav className={styles.choices} aria-label="选择进化石">{evolutionStones.map((item,i)=><button key={item.id} aria-pressed={selected===i} onClick={()=>{setSelected(i);stopVoice();speakText(owner,stoneNarration(item),{systemFallback:true});}}><StoneArt stone={item}/><strong>{item.name}</strong></button>)}</nav>
 <section className={styles.detail} style={{'--stone-light':stone.light,'--stone-color':stone.color} as CSSProperties} aria-label={`${stone.name}介绍`}>
 <div className={styles.intro}><div className={styles.stonePicture}><StoneArt stone={stone}/></div><div><span className={styles.counter}>0{selected+1} / 05</span><h2>{stone.name}<ReadAloud key={stone.id} text={stoneNarration(stone)} systemFallback label={`听听${stone.name}和对应的进化`}/></h2><p>{stone.description}</p><small>哪些伙伴会用到它？</small></div></div>
 <div className={styles.pairs}>{stone.pairs.map(([from,to])=><div className={styles.pair} key={from}><div><PokemonArt pokemon={pokemonById.get(from)!} hidden/><strong>{pokemonById.get(from)!.name}</strong></div><div className={styles.arrow}><StoneArt stone={stone}/><ArrowRight size={23}/></div><div><PokemonArt pokemon={pokemonById.get(to)!} hidden/><strong>{pokemonById.get(to)!.name}</strong></div></div>)}</div>
 </section>
 <aside className={styles.story}><Tv size={24}/><div><h3>动画里的小故事</h3><p>{stone.id==='moon'?'无印篇里，小智在月见山遇到了皮皮。月之石的碎片让一些皮皮进化成了皮可西。':stone.id==='leaf'?'无印篇里，魔术师的蛋蛋在森林中进化成了椰蛋树。在火红和叶绿游戏里，想让蛋蛋进化，就要给它使用叶之石。':'无印篇的伊布四兄弟故事里，出现了火、水、雷三种进化石，也出现了火伊布、水伊布和雷伊布。最小的弟弟选择让自己的伊布保持原样，伙伴也可以不急着进化。'}</p></div></aside>
 <details className="encyclopedia-notes"><summary>给家长看的资料说明</summary><p>进化对应表采用《宝可梦火红／叶绿》中关都图鉴001—151的进化条件，共五种石头、16条对应关系；不是整个系列全部进化石。太阳之石涉及关都151以外的进化，本篇不展开，也不混入后世代的叶伊布、冰伊布或地区形态。</p><p>游戏中给适用宝可梦使用进化石即可进化，会消耗石头。伊布在本篇有火、水、雷三种分支，月之石不能让它进化成月亮伊布。动画故事独立介绍，不作为游戏操作规则。插图为本应用绘制的示意；伙伴统一使用剪影，无收藏解锁、答题或奖励，百科也不会消耗背包道具。语音使用预先制作的中文配音。</p><a href="https://pokemondb.net/evolution/stone" target="_blank" rel="noreferrer">进化石对应关系 ↗</a><a href="https://www.serebii.net/fireredleafgreen/items.shtml" target="_blank" rel="noreferrer">火红／叶绿道具资料 ↗</a><a href="https://bulbapedia.bulbagarden.net/wiki/EP040" target="_blank" rel="noreferrer">无印篇：伊布四兄弟 ↗</a><a href="https://bulbapedia.bulbagarden.net/wiki/EP006" target="_blank" rel="noreferrer">无印篇：皮皮与月之石 ↗</a><a href="https://bulbapedia.bulbagarden.net/wiki/EP043" target="_blank" rel="noreferrer">无印篇：椰蛋树的故事 ↗</a></details>
 </div>;
}
