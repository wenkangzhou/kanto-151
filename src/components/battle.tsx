'use client';
import Link from 'next/link';
import { useEffect, useId, useReducer, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowLeftRight, RotateCcw, Swords, Trophy, Handshake, Shuffle } from 'lucide-react';
import { useCollection } from './collection-provider';
import { CollectionMark } from './collection-mark';
import { PokemonArt } from './pokemon-art';
import { BattleMoveEffect } from './battle-move-effect';
import { TypePicture } from './type-badge';
import { pokemonById } from '@/domain/pokemon';
import { battleReducer, createBattle, opponentPool, pickOpponent, multiplier, usableMoves } from '@/domain/battle';
import { speakText, stopVoice } from '@/lib/voice-audio';

export function Battle() {
  const { snapshot, status } = useCollection();
  const team = (snapshot.team ?? []).filter(id => snapshot.records.some(record => record.pokemonId === id));
  const [match, setMatch] = useState<{team:number[];enemy:number;key:number}|null>(null);
  function start() {
    const pool=opponentPool(snapshot.records.map(r=>r.pokemonId),team);
    if(team.length&&pool.length)setMatch({team:[...team],enemy:pickOpponent(pool,match?.enemy,crypto.getRandomValues(new Uint32Array(1))[0]/4294967296)!,key:(match?.key??0)+1});
  }
  return <div className="page battle-page"><Link href="/team" className="back-link"><ArrowLeft size={18}/>回小队</Link>
    {match?<Match key={match.key} team={match.team} enemy={match.enemy} again={start} canChange={opponentPool(snapshot.records.map(r=>r.pokemonId),team).some(id=>id!==match.enemy)}/>:<section className="battle-welcome"><Swords size={40}/><h1>来一场友好对战吧！</h1><p>选伙伴、试招式，也可以换伙伴上场。</p><div className="battle-lineup">{team.map(id=><PokemonArt key={id} pokemon={pokemonById.get(id)!}/>)}</div>{status==='loading'?<p>正在找你的小队…</p>:team.length?<button className="button" onClick={start}>去对战 <Swords size={20}/></button>:<><p>先邀请一位伙伴加入小队吧。</p><Link href="/team" className="button">去选伙伴</Link></>}<small>每场结束都会恢复体力，不消耗道具。</small></section>}
  </div>;
}
function Health({id,hp}:{id:number;hp:number}) {
  return <div className="battle-health"><strong>{pokemonById.get(id)!.name}</strong><div role="progressbar" aria-label={`${pokemonById.get(id)!.name}的体力`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={hp}><span style={{width:`${hp}%`,background:hp>45?'#7f9e6c':hp>20?'#dbac48':'#d97765'}}/></div><small>{hp===0?'休息中':'体力'}</small></div>;
}
function Match({team,enemy,again,canChange}:{team:number[];enemy:number;again:()=>void;canChange:boolean}) {
  const [state,dispatch]=useReducer(battleReducer,undefined,()=>createBattle(team,enemy));
  const [selected,setSelected]=useState<number|null>(null);
  const [switching,setSwitching]=useState(false);
  const reduced=useReducedMotion();
  const voice=useId();
  const summoning=state.phase==='summon';
  const busy=summoning||state.phase==='player'||state.phase==='enemy';
  useEffect(()=>{if(!busy)return;const timer=setTimeout(()=>dispatch({type:'advance'}),summoning?(reduced?350:1800):1500);return()=>clearTimeout(timer);},[busy,state.phase,reduced,summoning]);
  useEffect(()=>{if(state.active!==null)speakText(voice,state.message);return()=>stopVoice(voice);},[state.message,state.active,voice]);
  const choose=state.phase==='choose'||switching;
  const active=state.active===null?null:pokemonById.get(state.active)!;
  function pick(){if(selected===null)return;dispatch({type:'choose',id:selected});setSelected(null);setSwitching(false);}
  return <>
    <div className="battle-title"><h1>友好对战</h1>{state.active===null&&canChange?<button className="button secondary battle-change-opponent" onClick={again}><Shuffle size={20} aria-hidden="true"/>换个对手</button>:<span>和熟悉的伙伴练一练</span>}</div>
    <section className={`battle-arena ${state.phase==='finished'?'battle-arena-ended':''}`} aria-label={state.phase==='finished'?'对战结果':'对战场地'}>
      {state.phase==='finished'?<div className={`battle-result-scene ${state.result==='win'?'won':''}`}>
        <span className="battle-result-heading">对战结束</span>
        <div className="battle-winner-art">
          {state.result==='draw'?<><PokemonArt pokemon={active!}/><Handshake size={48} aria-hidden="true"/><PokemonArt pokemon={pokemonById.get(enemy)!}/></>:<><PokemonArt pokemon={state.result==='win'?active!:pokemonById.get(enemy)!}/><span className="battle-trophy" aria-hidden="true"><Trophy size={66}/></span></>}
        </div>
        <strong>{state.result==='win'?`${active!.name}赢啦！`:state.result==='rest'?`${pokemonById.get(enemy)!.name}获胜`:'双方打成平手'}</strong>
        <span>{state.result==='win'?'我们的小队获胜！':state.result==='rest'?'对手获胜，我们下次再加油！':'握握手，下次再切磋！'}</span>
      </div>:<>
      <div className="battle-opponent"><Health id={enemy} hp={state.enemyHp}/><motion.div animate={reduced?{}:state.phase==='enemy'?{x:[0,8,0,-14,0]}:state.phase==='ready'&&state.rounds?{x:0}: {x:0}} transition={{duration:.5}} key={`enemy-${state.phase}-${state.rounds}`}><PokemonArt pokemon={pokemonById.get(enemy)!}/></motion.div></div>
      <div className={`battle-player ${summoning?'is-summoning':''}`}>{active?<><motion.div className="battle-player-art" key={`${active.id}-${state.phase}-${state.rounds}`} animate={reduced?{}:state.phase==='player'?{x:[0,18,0]}:state.rounds?{x:[0,-10,0]}:{scale:[.96,1]}} transition={{duration:.5}}><PokemonArt pokemon={active}/></motion.div><Health id={active.id} hp={state.hp[active.id]}/></>:<div className="battle-empty">谁来上场？</div>}</div>
      {summoning&&<div className="battle-summon" key={`summon-${state.active}`} aria-hidden="true"><span className="battle-thrown-ball"><CollectionMark state="available"/></span><span className="battle-release-light"/></div>}
      {(state.phase==='player'||state.phase==='enemy')&&state.move&&<BattleMoveEffect key={`${state.phase}-${state.rounds}`} move={state.move} side={state.phase} hits={multiplier(state.move,state.phase==='player'?enemy:state.active!)>0}/>}
      </>}
    </section>
    <div className="battle-message" role="status">{state.message}</div>
    <section className="battle-controls" aria-label="对战操作">
      {state.phase==='finished'?<div className="battle-end"><h2>{state.result==='win'?'我们赢啦！':state.result==='draw'?'下次再切磋！':'休息好，再出发！'}</h2><p>所有伙伴的体力，下场都会恢复。</p><div><button className="button" onClick={again}><RotateCcw size={19}/>再来一场</button><Link href="/team" className="button secondary">回小队</Link></div></div>:choose?<><h2>{state.active===null?'谁来第一个上场？':'换谁来上场？'}</h2><div className="battle-choices">{team.map(id=><button key={id} disabled={state.hp[id]===0||id===state.active} aria-pressed={selected===id} onClick={()=>setSelected(id)}><PokemonArt pokemon={pokemonById.get(id)!}/><strong>{pokemonById.get(id)!.name}</strong><small>{state.hp[id]===0?'休息中':id===state.active?'正在场上':`体力 ${state.hp[id]}`}</small></button>)}</div><div className="battle-choice-actions"><button className="button" disabled={selected===null} onClick={pick}>就决定是你了！</button>{switching&&<button className="button secondary" onClick={()=>{setSwitching(false);setSelected(null);}}>先不换</button>}</div>{switching&&<p className="muted">换伙伴后，对手会出招。</p>}</>:active?<><div className="battle-moves">{usableMoves(active.id,enemy).map(move=><button key={move.id} disabled={busy} onClick={()=>dispatch({type:'attack',moveId:move.id})}><strong>{move.name}</strong>{move.fallback?<small>特别招式</small>:<TypePicture type={move.type} interactive={false}/>}</button>)}</div><button className="button secondary battle-switch" disabled={busy||team.filter(id=>id!==active.id&&state.hp[id]>0).length===0} onClick={()=>setSwitching(true)}><ArrowLeftRight size={20}/>换伙伴</button></>:null}
    </section>
  </>;
}
