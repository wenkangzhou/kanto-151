'use client';
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw, Swords, Trophy, Handshake, Shuffle } from 'lucide-react';
import { useCollection } from './collection-provider';
import { CollectionMark } from './collection-mark';
import { PokemonArt } from './pokemon-art';
import { BattleMoveEffect } from './battle-move-effect';
import { TypePicture } from './type-badge';
import { pokemonById } from '@/domain/pokemon';
import { battleReducer, maxHp, healthPercent, createBattle, opponentPool, pickOpponent, multiplier, usableMoves, type BattleHit } from '@/domain/battle';
import { battleSound } from '@/lib/battle-audio';
import { speakText, stopVoice, subscribeVoice, voiceSnapshot } from '@/lib/voice-audio';

export function Battle() {
  const { snapshot, status } = useCollection();
  const audioOwner = useId();
  useEffect(()=>()=>{battleSound(audioOwner,'leave');stopVoice(audioOwner);},[audioOwner]);
  const team = useMemo(() => (snapshot.team ?? []).filter(id => snapshot.records.some(record => record.pokemonId === id)), [snapshot]);
  const seen = useRef<number[]>([]);
  const [match, setMatch] = useState<{team:number[];enemy:number;key:number}|null>(null);
  const start = useCallback((keepOpponent = false, announceOpponent = false, announce = true) => {
    const pool=opponentPool(snapshot.records.map(r=>r.pokemonId));
    if (!team.length || !pool.length) return;
    const enemy = keepOpponent && match ? match.enemy : pickOpponent(pool, match?.enemy, crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296, seen.current)!;
    if (!keepOpponent) {
      if (pool.every(id => seen.current.includes(id))) seen.current = match ? [match.enemy] : [];
      seen.current.push(enemy);
    }
    battleSound(audioOwner, 'enter');
    // Rapid opponent changes replace the previous announcement instead of toggling it off.
    stopVoice(audioOwner);
    if (announce) speakText(audioOwner, announceOpponent ? pokemonById.get(enemy)!.name : '选一位伙伴出场吧！');
    setMatch({ team: [...team], enemy, key: (match?.key ?? 0) + 1 });
  }, [snapshot, team, match, audioOwner]);
  useEffect(() => {
    if (match || !team.length || !['ready', 'demo'].includes(status)) return;
    const timer = setTimeout(() => start(false, false, false), 0);
    return () => clearTimeout(timer);
  }, [match, team.length, status, start]);
  return <div className="page battle-page">{!match&&<Link href="/team" className="back-link"><ArrowLeft size={18}/>回小队</Link>}
    {match?<Match audioOwner={audioOwner} key={match.key} team={match.team} enemy={match.enemy} again={()=>start(false, true)} retry={()=>start(true)} canChange={opponentPool(snapshot.records.map(r=>r.pokemonId)).some(id=>id!==match.enemy)}/>:<section className="battle-welcome"><Swords size={40}/><h1>来一场友好对战吧！</h1><p>双方各选一位伙伴，体力用完，这场就结束。</p><div className="battle-lineup">{team.map(id=><PokemonArt key={id} pokemon={pokemonById.get(id)!}/>)}</div>{status==='loading'?<p>正在找你的小队…</p>:team.length?<p role="status">正在准备对手…</p>:<><p>先邀请一位伙伴加入小队吧。</p><Link href="/team" className="button">去选伙伴</Link></>}<small>每场结束都会恢复体力，不消耗道具。</small></section>}
  </div>;
}
const hitStrength = (effect: number) => effect > 1 ? 24 : effect < 1 ? 10 : 17;
const healthColor = (hp: number) => hp > 45 ? '#7f9e6c' : hp > 20 ? '#dbac48' : '#d97765';
function Health({id,hp,hit,showTypes=false,interactive=true}:{id:number;hp:number;hit?:BattleHit;showTypes?:boolean;interactive?:boolean}) {
  const reduced=useReducedMotion();
  const lost=hit&&hit.after<hit.before;
  const percent=healthPercent(id,hp);
  return <div className="battle-health"><strong>{pokemonById.get(id)!.name}</strong>{showTypes&&<div className="battle-opponent-types" aria-label="对手的属性">{pokemonById.get(id)!.types.map(type=><TypePicture key={type} type={type} interactive={interactive}/>)}</div>}<div className="battle-hp-track" role="progressbar" aria-label={`${pokemonById.get(id)!.name}的体力`} aria-valuemin={0} aria-valuemax={maxHp(id)} aria-valuenow={hp}><span style={{width:`${percent}%`,background:healthColor(percent)}}/>{lost&&!reduced&&<motion.span className="battle-hp-loss" key={`${hit.before}-${hit.after}`} style={{left:`${healthPercent(id,hit.after)}%`}} initial={{width:`${healthPercent(id,hit.before-hit.after)}%`,opacity:1}} animate={{width:0,opacity:0}} transition={{delay:.45,duration:.7}}/>}</div><small>{hp===0?'休息中':'体力'}</small></div>;
}
function Match({team,enemy,again,retry,canChange,audioOwner}:{team:number[];enemy:number;again:()=>void;retry:()=>void;canChange:boolean;audioOwner:string}) {
  const [state,dispatch]=useReducer(battleReducer,undefined,()=>createBattle(team,enemy));
  const [selected,setSelected]=useState<number|null>(null);
  const reduced=useReducedMotion();
  const voice=useId();
  const summoning=state.phase==='summon';
  const busy=state.phase==='order'||summoning||state.phase==='player'||state.phase==='enemy'||state.phase==='player-feedback'||state.phase==='enemy-feedback';
  useEffect(()=>{
    if(state.active===null)return;
    // Speak and observe within one effect so even synchronous speech failures settle.
    if(state.phase!=='ready')speakText(voice,state.phase==='order'?pokemonById.get(state.first==='enemy'?enemy:state.active)!.name:state.message);
    if(!busy)return()=>stopVoice(voice);
    let elapsed=false;
    let advanced=false;
    const advance=()=>{if(advanced)return;advanced=true;dispatch({type:'advance'});};
    const check=()=>{if(elapsed&&!voiceSnapshot().owner)advance();};
    const unsubscribe=subscribeVoice(check);
    const minimum=setTimeout(()=>{elapsed=true;check();},state.phase==='order'?2400:summoning?(reduced?350:1800):state.phase.endsWith('feedback')?1300:1500);
    // A device that never completes speech must not freeze the match.
    const fallback=setTimeout(advance,12000);
    return()=>{clearTimeout(minimum);clearTimeout(fallback);unsubscribe();stopVoice(voice);};
  },[busy,state.phase,state.message,state.active,state.first,enemy,reduced,summoning,voice]);
  useEffect(()=>{
    if(state.phase==='summon')battleSound(audioOwner,'throw');
    else if(state.phase==='finished')battleSound(audioOwner,state.result==='win'?'win':'rest');
    else if((state.phase==='player-feedback'||state.phase==='enemy-feedback')&&state.move&&multiplier(state.move,state.phase==='player-feedback'?enemy:state.active!)>0)battleSound(audioOwner,'hit');
  },[state.phase,state.result,state.move,state.active,enemy,audioOwner]);
  const impact=state.phase.endsWith('feedback')&&state.lastHit&&state.lastHit.after<state.lastHit.before;
  const strongImpact=impact&&state.move&&multiplier(state.move,state.lastHit!.target)>1;
  const choose=state.phase==='choose';
  const active=state.active===null?null:pokemonById.get(state.active)!;
  function pick(id:number){dispatch({type:'choose',id,tieRandom:crypto.getRandomValues(new Uint32Array(1))[0]/4294967296});setSelected(null);}
  return <>
    <div className="battle-title"><div className="battle-title-main"><Link href="/team" className="back-link"><ArrowLeft size={18}/>回小队</Link></div>{state.active===null&&canChange?<button className="button secondary battle-change-opponent" onClick={again}><Shuffle size={20} aria-hidden="true"/>换个对手</button>:<span>一对一 · 选定后不换伙伴</span>}</div>
    <section className={`battle-arena ${strongImpact&&!reduced?'battle-arena-impact':''} ${choose?'battle-arena-choosing':''} ${state.phase==='finished'?'battle-arena-ended':''}`} aria-label={state.phase==='finished'?'对战结果':'对战场地'}>
      {state.phase==='finished'?<div className={`battle-result-scene ${state.result==='win'?'won':''}`}>
        <span className="battle-result-heading">对战结束</span>
        <div className="battle-winner-art">
          {state.result==='draw'?<><PokemonArt pokemon={active!}/><Handshake size={48} aria-hidden="true"/><PokemonArt pokemon={pokemonById.get(enemy)!}/></>:<><PokemonArt pokemon={state.result==='win'?active!:pokemonById.get(enemy)!}/><span className="battle-trophy" aria-hidden="true"><Trophy size={66}/></span></>}
        </div>
        <strong>{state.result==='win'?`${active!.name}赢啦！`:state.result==='rest'?`${pokemonById.get(enemy)!.name}获胜`:'双方打成平手'}</strong>
        <span>{state.result==='win'?'我们的小队获胜！':state.result==='rest'?'对手获胜，我们下次再加油！':'握握手，下次再切磋！'}</span>
      </div>:<>
      <div className="battle-opponent"><Health id={enemy} hp={state.enemyHp} hit={state.lastHit?.target===enemy&&state.phase==='player-feedback'?state.lastHit:undefined} showTypes interactive={!busy}/><motion.div animate={reduced?{}:state.phase==='player-feedback'&&state.move&&multiplier(state.move,enemy)>0?{x:[0,hitStrength(multiplier(state.move,enemy)),-7,4,0]}:state.phase==='enemy'?{x:[0,-14,0]}:state.phase==='ready'&&state.rounds?{x:0}: {x:0}} transition={{duration:.22,ease:"easeOut"}} key={`enemy-${state.phase}-${state.rounds}`}><PokemonArt pokemon={pokemonById.get(enemy)!}/></motion.div></div>
      <div className={`battle-player ${summoning?'is-summoning':''}`}>{active?<><motion.div className="battle-player-art" key={`${active.id}-${state.phase}-${state.rounds}`} animate={reduced?{}:state.phase==='player'?{x:[0,18,0]}:state.phase==='enemy-feedback'&&state.move&&multiplier(state.move,active.id)>0?{x:[0,-hitStrength(multiplier(state.move,active.id)),7,-4,0]}:{x:0}} transition={{duration:.22,ease:"easeOut"}}><PokemonArt pokemon={active}/></motion.div><Health id={active.id} hp={state.hp[active.id]} hit={state.lastHit?.target===active.id&&state.phase==='enemy-feedback'?state.lastHit:undefined}/></>:<div className="battle-empty">谁来上场？</div>}</div>
      {summoning&&<div className="battle-summon" key={`summon-${state.active}`} aria-hidden="true"><span className="battle-thrown-ball"><CollectionMark state="available"/></span><span className="battle-release-light"/></div>}
      {(state.phase==='player'||state.phase==='enemy')&&state.move&&<BattleMoveEffect key={`${state.phase}-${state.rounds}`} move={state.move} side={state.phase} hits={multiplier(state.move,state.phase==='player'?enemy:state.active!)>0}/>}
      </>}
    </section>
    {active&&state.phase!=='finished'&&<div className={`battle-turn-order ${state.phase==='order'?'is-announcing':''}`} aria-label="每轮出招顺序">
      {[state.first==='enemy'?enemy:active.id,state.first==='enemy'?active.id:enemy].map((id,index)=><span className="battle-turn-partner" key={index}>{index===1&&<ArrowRight size={20} aria-hidden="true"/>}<PokemonArt pokemon={pokemonById.get(id)!}/><span><b>{index===0?'先出招':'后出招'} · {pokemonById.get(id)!.name}</b><small>速度 {pokemonById.get(id)!.stats.speed}</small></span></span>)}
    </div>}
    <div className={`battle-message ${choose?'battle-message-choose':''}`} role="status">{state.message}</div>
    <section className="battle-controls" aria-label="对战操作">
      {state.phase==='finished'?<div className="battle-end"><h2>{state.result==='win'?'我们赢啦！':state.result==='draw'?'下次再切磋！':'休息好，再出发！'}</h2>{state.moment&&<section className="battle-recap" aria-label="这一场的小发现"><h3>{state.moment.multiplier>1?'刚才这招很有效！':state.moment.multiplier===1?'刚才这一招打中了！':'这一招效果不显著'}</h3><div className="battle-recap-row"><span className="battle-recap-partner"><PokemonArt pokemon={active!}/><b>{active!.name}</b></span><span className="battle-recap-move"><b>{state.moment.move.name}</b>{state.moment.move.fallback?<small>特别招式</small>:<TypePicture type={state.moment.move.type}/>}</span><ArrowRight className="battle-recap-arrow" size={24} aria-hidden="true"/><span className="battle-recap-partner"><PokemonArt pokemon={pokemonById.get(state.moment.target)!}/><b>{pokemonById.get(state.moment.target)!.name}</b><span className="battle-recap-types">{pokemonById.get(state.moment.target)!.types.map(type=><TypePicture type={type} key={type}/>)}</span></span></div><p>{state.moment.move.fallback?'这次使用了不受属性相克影响的特别招式。':<>这次属性效果 ×{state.moment.multiplier}{pokemonById.get(state.moment.target)!.types.length>1?'，对手的两种属性一起计算。':'。'}</>}</p></section>}<p>下一场双方都会恢复体力，可以重新选伙伴。</p><div><button className="button" onClick={retry}><RotateCcw size={19}/>{state.result==='rest'?'换位伙伴再试':'再来一场'}</button><Link href="/team" className="button secondary">回小队</Link></div></div>:choose?<><h2>选一位伙伴，再点一下就上场</h2><div className="battle-choices">{team.map(id=>{
        const partner=pokemonById.get(id)!;
        const hp=state.hp[id];
        const percent=healthPercent(id,hp);
        const resting=hp===0;
        const onField=id===state.active&&!resting;
        const status=resting?'休息中':onField?'正在场上':percent>45?'准备好啦':percent>20?'有点累了':'需要休息';
        return <article key={id} className="battle-choice-card"><button className={`battle-choice-select ${resting?'is-resting':onField?'is-on-field':''}`} disabled={resting||onField} aria-label={`${partner.name}，${status}，体力 ${hp} / ${maxHp(id)}`} aria-pressed={selected===id} onClick={()=>selected===id?pick(id):setSelected(id)}>
          <PokemonArt pokemon={partner}/><strong>{partner.name}</strong>
          <span className="battle-choice-health" aria-hidden="true"><span style={{width:`${percent}%`,background:healthColor(percent)}}/></span>
          <small className="battle-choice-status">{selected===id?'再点一下，上场！':status}</small>
        </button><div className="battle-candidate-types" aria-label={`${partner.name}的属性`}>{partner.types.map(type=><TypePicture key={type} type={type}/>)}</div><small className="battle-candidate-speed">速度 {partner.stats.speed}</small></article>;
      })}</div></>:active?<><div className="battle-moves">{usableMoves(active.id,enemy).map(move=><motion.button key={move.id} disabled={busy} className={state.phase==='player'&&state.move?.id===move.id?'is-casting':''} whileTap={reduced?undefined:{scale:.9,y:6}} animate={reduced?undefined:state.phase==='player'&&state.move?.id===move.id?{scale:[.9,1.055,1],y:[6,-3,0]}:{scale:1,y:0}} transition={{duration:.24}} onClick={()=>{ if(state.phase!=='ready')return; if(!reduced&&typeof navigator.vibrate==='function'){try{navigator.vibrate(18);}catch{ /* Optional hardware feedback must not interrupt a turn. */ }} dispatch({type:'attack',moveId:move.id}); }}><strong>{move.name}</strong>{move.fallback?<small>特别招式</small>:<TypePicture type={move.type} interactive={false}/>}</motion.button>)}</div></>:null}
    </section>
  </>;
}
