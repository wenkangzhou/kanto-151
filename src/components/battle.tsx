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
import { battleSound } from '@/lib/battle-audio';
import { speakText, stopVoice, subscribeVoice, voiceSnapshot } from '@/lib/voice-audio';

export function Battle() {
  const { snapshot, status } = useCollection();
  const audioOwner = useId();
  useEffect(()=>()=>battleSound(audioOwner,'leave'),[audioOwner]);
  const team = (snapshot.team ?? []).filter(id => snapshot.records.some(record => record.pokemonId === id));
  const [match, setMatch] = useState<{team:number[];enemy:number;key:number}|null>(null);
  function start() {
    const pool=opponentPool(snapshot.records.map(r=>r.pokemonId),team);
    if(team.length&&pool.length){battleSound(audioOwner,'enter');setMatch({team:[...team],enemy:pickOpponent(pool,match?.enemy,crypto.getRandomValues(new Uint32Array(1))[0]/4294967296)!,key:(match?.key??0)+1});}
  }
  return <div className="page battle-page"><Link href="/team" className="back-link"><ArrowLeft size={18}/>回小队</Link>
    {match?<Match audioOwner={audioOwner} key={match.key} team={match.team} enemy={match.enemy} again={start} canChange={opponentPool(snapshot.records.map(r=>r.pokemonId),team).some(id=>id!==match.enemy)}/>:<section className="battle-welcome"><Swords size={40}/><h1>来一场友好对战吧！</h1><p>选伙伴、试招式，也可以换伙伴上场。</p><div className="battle-lineup">{team.map(id=><PokemonArt key={id} pokemon={pokemonById.get(id)!}/>)}</div>{status==='loading'?<p>正在找你的小队…</p>:team.length?<button className="button" onClick={start}>去对战 <Swords size={20}/></button>:<><p>先邀请一位伙伴加入小队吧。</p><Link href="/team" className="button">去选伙伴</Link></>}<small>每场结束都会恢复体力，不消耗道具。</small></section>}
  </div>;
}
const healthColor = (hp: number) => hp > 45 ? '#7f9e6c' : hp > 20 ? '#dbac48' : '#d97765';
function Health({id,hp,showTypes=false,interactive=true}:{id:number;hp:number;showTypes?:boolean;interactive?:boolean}) {
  return <div className="battle-health"><strong>{pokemonById.get(id)!.name}</strong>{showTypes&&<div className="battle-opponent-types" aria-label="对手的属性">{pokemonById.get(id)!.types.map(type=><TypePicture key={type} type={type} interactive={interactive}/>)}</div>}<div role="progressbar" aria-label={`${pokemonById.get(id)!.name}的体力`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={hp}><span style={{width:`${hp}%`,background:healthColor(hp)}}/></div><small>{hp===0?'休息中':'体力'}</small></div>;
}
function Match({team,enemy,again,canChange,audioOwner}:{team:number[];enemy:number;again:()=>void;canChange:boolean;audioOwner:string}) {
  const [state,dispatch]=useReducer(battleReducer,undefined,()=>createBattle(team,enemy));
  const [selected,setSelected]=useState<number|null>(null);
  const [switching,setSwitching]=useState(false);
  const reduced=useReducedMotion();
  const voice=useId();
  const summoning=state.phase==='summon';
  const busy=summoning||state.phase==='player'||state.phase==='enemy'||state.phase==='player-feedback'||state.phase==='enemy-feedback';
  useEffect(()=>{
    if(state.active===null)return;
    // Speak and observe within one effect so even synchronous speech failures settle.
    if(state.phase!=='ready')speakText(voice,state.message);
    if(!busy)return()=>stopVoice(voice);
    let elapsed=false;
    let advanced=false;
    const advance=()=>{if(advanced)return;advanced=true;dispatch({type:'advance'});};
    const check=()=>{if(elapsed&&!voiceSnapshot().owner)advance();};
    const unsubscribe=subscribeVoice(check);
    const minimum=setTimeout(()=>{elapsed=true;check();},summoning?(reduced?350:1800):state.phase.endsWith('feedback')?1100:1500);
    // A device that never completes speech must not freeze the match.
    const fallback=setTimeout(advance,12000);
    return()=>{clearTimeout(minimum);clearTimeout(fallback);unsubscribe();stopVoice(voice);};
  },[busy,state.phase,state.message,state.active,reduced,summoning,voice]);
  useEffect(()=>{
    if(state.phase==='summon')battleSound(audioOwner,'throw');
    else if(state.phase==='finished')battleSound(audioOwner,state.result==='win'?'win':'rest');
    else if((state.phase==='player-feedback'||state.phase==='enemy-feedback')&&state.move&&multiplier(state.move,state.phase==='player-feedback'?enemy:state.active!)>0)battleSound(audioOwner,'hit');
  },[state.phase,state.result,state.move,state.active,enemy,audioOwner]);
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
      <div className="battle-opponent"><Health id={enemy} hp={state.enemyHp} showTypes interactive={!busy}/><motion.div animate={reduced?{}:state.phase==='player-feedback'&&state.move&&multiplier(state.move,enemy)>0?{x:[0,8,0]}:state.phase==='enemy'?{x:[0,-14,0]}:state.phase==='ready'&&state.rounds?{x:0}: {x:0}} transition={{duration:.5}} key={`enemy-${state.phase}-${state.rounds}`}><PokemonArt pokemon={pokemonById.get(enemy)!}/></motion.div></div>
      <div className={`battle-player ${summoning?'is-summoning':''}`}>{active?<><motion.div className="battle-player-art" key={`${active.id}-${state.phase}-${state.rounds}`} animate={reduced?{}:state.phase==='player'?{x:[0,18,0]}:state.phase==='enemy-feedback'&&state.move&&multiplier(state.move,active.id)>0?{x:[0,-10,0]}:{x:0}} transition={{duration:.5}}><PokemonArt pokemon={active}/></motion.div><Health id={active.id} hp={state.hp[active.id]}/></>:<div className="battle-empty">谁来上场？</div>}</div>
      {summoning&&<div className="battle-summon" key={`summon-${state.active}`} aria-hidden="true"><span className="battle-thrown-ball"><CollectionMark state="available"/></span><span className="battle-release-light"/></div>}
      {(state.phase==='player'||state.phase==='enemy')&&state.move&&<BattleMoveEffect key={`${state.phase}-${state.rounds}`} move={state.move} side={state.phase} hits={multiplier(state.move,state.phase==='player'?enemy:state.active!)>0}/>}
      </>}
    </section>
    <div className="battle-message" role="status">{state.message}</div>
    <section className="battle-controls" aria-label="对战操作">
      {state.phase==='finished'?<div className="battle-end"><h2>{state.result==='win'?'我们赢啦！':state.result==='draw'?'下次再切磋！':'休息好，再出发！'}</h2><p>所有伙伴的体力，下场都会恢复。</p><div><button className="button" onClick={again}><RotateCcw size={19}/>再来一场</button><Link href="/team" className="button secondary">回小队</Link></div></div>:choose?<><h2>{state.active===null?'谁来第一个上场？':'换谁来上场？'}</h2><div className="battle-choices">{team.map(id=>{
        const partner=pokemonById.get(id)!;
        const hp=state.hp[id];
        const resting=hp===0;
        const onField=id===state.active&&!resting;
        const status=resting?'休息中':onField?'正在场上':hp>45?'准备好啦':hp>20?'有点累了':'需要休息';
        return <button key={id} className={resting?'is-resting':onField?'is-on-field':''} disabled={resting||onField} aria-label={`${partner.name}，${status}，体力 ${hp} / 100`} aria-pressed={selected===id} onClick={()=>setSelected(id)}>
          <PokemonArt pokemon={partner}/><strong>{partner.name}</strong>
          <span className="battle-choice-health" aria-hidden="true"><span style={{width:`${hp}%`,background:healthColor(hp)}}/></span>
          <small className="battle-choice-status">{status}</small>
        </button>;
      })}</div><div className="battle-choice-actions"><button className="button battle-confirm-partner" disabled={selected===null} aria-label={selected===null?'先选一位伙伴':`就决定是你了，${pokemonById.get(selected)!.name}！`} onClick={pick}>{selected!==null&&<PokemonArt pokemon={pokemonById.get(selected)!}/>}<span>{selected===null?'先选一位伙伴':'就决定是你了！'}</span></button>{switching&&<button className="button secondary" onClick={()=>{setSwitching(false);setSelected(null);}}>先不换</button>}</div>{switching&&<p className="muted">换伙伴后，对手会出招。</p>}</>:active?<><div className="battle-moves">{usableMoves(active.id,enemy).map(move=><button key={move.id} disabled={busy} onClick={()=>dispatch({type:'attack',moveId:move.id})}><strong>{move.name}</strong>{move.fallback?<small>特别招式</small>:<TypePicture type={move.type} interactive={false}/>}</button>)}</div><button className="button secondary battle-switch" disabled={busy||team.filter(id=>id!==active.id&&state.hp[id]>0).length===0} onClick={()=>setSwitching(true)}><ArrowLeftRight size={20}/>换伙伴</button></>:null}
    </section>
  </>;
}
