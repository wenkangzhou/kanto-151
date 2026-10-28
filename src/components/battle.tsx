'use client';
import { useT, useLocale } from '@/lib/i18n/locale';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import { usePlayTimeAnimation } from './play-time';
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw, Swords, Trophy, Handshake, Shuffle, X } from 'lucide-react';
import { useCollection } from './collection-provider';
import { CollectionMark } from './collection-mark';
import { PokemonArt } from './pokemon-art';
import { BattleMoveEffect, BattleHitEffect } from './battle-move-effect';
import { TypeSymbol } from './type-symbol';
import { TYPE_NAMES, type PokemonType } from '@/domain/types';
import {effectiveness} from '@/domain/effectiveness';
import {multiplierLabel} from '@/domain/type-encyclopedia';
import { TypePicture } from './type-badge';
import { pokemonById } from '@/domain/pokemon';
import { battleReducer, createNextBattle, battleMoves, maxHp, healthPercent, opponentPool, pickOpponent, multiplier, usableMoves, type BattleHit, type BattleState } from '@/domain/battle';
import type { MovePresets } from '@/domain/battle-loadout';
import { prepareBattleAudio } from '@/lib/battle-assets';
import { battleSound } from '@/lib/battle-audio';
import { speakText, stopVoice, subscribeVoice, voiceSnapshot, voiceServerSnapshot, voiceSource } from '@/lib/voice-audio';

type MatchSetup = {team:number[];enemy:number;key:number;partner?:number;tieRandom?:number;presets:MovePresets;resumeState?:BattleState};
type SavedRecap = {version:1;token:string;match:MatchSetup;state:BattleState};
const recapStorageKey='kanto-battle-recap';
let memoryRecap:SavedRecap|null=null;
function readRecap(token:string):SavedRecap|null {
  let saved=memoryRecap;
  if(saved?.token!==token){try{saved=JSON.parse(sessionStorage.getItem(recapStorageKey)??'null') as SavedRecap|null;}catch{return null;}}
  if(!saved||saved.version!==1||saved.token!==token)return null;
  const {match,state}=saved;
  if(state?.phase!=='finished'||!pokemonById.has(match?.enemy)||!pokemonById.has(state.active??-1))return null;
  if(!Array.isArray(match.team)||!match.presets||!state.hp||!state.presets||state.enemy!==match.enemy)return null;
  if(state.moment&&!pokemonById.has(state.moment.target))return null;
  return saved;
}
export function Battle({recapToken}:{recapToken?:string}) {
  const localize = useT();
  const router=useRouter();
  const { snapshot, status } = useCollection();
  const audioOwner = useId();
  useEffect(()=>()=>{battleSound(audioOwner,'leave');stopVoice(audioOwner);},[audioOwner]);
  const team = useMemo(() => (snapshot.team ?? []).filter(id => snapshot.records.some(record => record.pokemonId === id)), [snapshot]);
  const [choosingOpponent,setChoosingOpponent]=useState(false);
  const seen = useRef<number[]>([]);
  const [match, setMatch] = useState<MatchSetup|null>(null);
  const [restoreChecked,setRestoreChecked]=useState(!recapToken);
  useEffect(()=>{
    if(!recapToken)return;
    const saved=readRecap(recapToken);
    const timer=setTimeout(()=>{
      if(saved)setMatch({...saved.match,resumeState:saved.state});
      setRestoreChecked(true);
    },0);
    return()=>clearTimeout(timer);
  },[recapToken]);
  const start = useCallback((keepOpponent = false, announceOpponent = false, announce = true, partner?:number, chosenEnemy?:number) => {
    const pool=opponentPool(snapshot.records.map(r=>r.pokemonId));
    if (!team.length || !pool.length) return;
    if(chosenEnemy!==undefined&&!pool.includes(chosenEnemy))return;
    if(window.location.search.includes('recap='))window.history.replaceState(null,'','/battle');
    memoryRecap=null;
    try{sessionStorage.removeItem(recapStorageKey);}catch{/* The next match can start without storage. */}
    const enemy = chosenEnemy ?? (keepOpponent && match ? match.enemy : pickOpponent(pool, match?.enemy, crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296, seen.current)!);
    if (!keepOpponent) {
      if (pool.every(id => seen.current.includes(id))) seen.current = match ? [match.enemy] : [];
      seen.current.push(enemy);
    }
    battleSound(audioOwner, 'enter');
    // Rapid opponent changes replace the previous announcement instead of toggling it off.
    stopVoice(audioOwner);
    if (announce) speakText(audioOwner, announceOpponent ? pokemonById.get(enemy)!.name : '选一位伙伴出场吧！');
    setMatch({ team: [...team], presets: structuredClone(snapshot.movePresets??{}), enemy, key: (match?.key ?? 0) + 1, partner:team.includes(partner!)?partner:undefined, tieRandom:crypto.getRandomValues(new Uint32Array(1))[0]/4294967296 });
  }, [snapshot, team, match, audioOwner]);
  useEffect(() => {
    if (!restoreChecked || match || !team.length || !['ready', 'demo'].includes(status)) return;
    const timer = setTimeout(() => start(false, false, false), 0);
    return () => clearTimeout(timer);
  }, [restoreChecked, match, team.length, status, start]);
  const openGuide=useCallback((state:BattleState)=>{
    if(!match||!state.moment||state.moment.move.fallback)return;
    const token=crypto.randomUUID();
    const saved:SavedRecap={version:1,token,match:{...match,resumeState:undefined},state};
    memoryRecap=saved;
    try{sessionStorage.setItem(recapStorageKey,JSON.stringify(saved));}catch{/* Keep the result in memory for this visit. */}
    window.history.replaceState(null,'',`/battle?recap=${token}`);
    const target=pokemonById.get(state.moment.target)!;
    const query=new URLSearchParams({from:'battle',attack:state.moment.move.type,defense:target.types[0],recap:token});
    if(target.types[1])query.set('defense2',target.types[1]);
    router.push(`/pokedex/encyclopedia/types?${query.toString()}`);
  },[match,router]);
  return <div className="page battle-page">{!match&&<Link href="/team" className="back-link"><ArrowLeft size={18}/>{localize("回小队")}</Link>}
    {match?<Match presets={match.presets} resumeState={match.resumeState} openGuide={openGuide} audioOwner={audioOwner} key={match.key} team={match.team} enemy={match.enemy} initialPartner={match.partner} tieRandom={match.tieRandom} next={id=>start(false,false,false,id)} again={()=>setChoosingOpponent(true)} retry={()=>start(true)} canChange={opponentPool(snapshot.records.map(r=>r.pokemonId)).some(id=>id!==match.enemy)}/>:restoreChecked?<section className="battle-welcome"><Swords size={40}/><h1>{localize("来一场友好对战吧！")}</h1><p>{localize("双方各选一位伙伴，体力用完，这场就结束。")}</p><div className="battle-lineup">{team.map(id=><PokemonArt key={id} pokemon={pokemonById.get(id)!}/>)}</div>{status==='loading'?<p>{localize("正在找你的小队…")}</p>:team.length?<p role="status">{localize("正在准备对手…")}</p>:<><p>{localize("先邀请一位伙伴加入小队吧。")}</p><Link href="/team" className="button">{localize("去选伙伴")}</Link></>}<small>{localize("每场结束都会恢复体力，不消耗道具。")}</small></section>:null}
    {choosingOpponent&&match&&<OpponentPicker current={match.enemy} owned={opponentPool(snapshot.records.map(r=>r.pokemonId))} onClose={()=>setChoosingOpponent(false)} onPick={id=>{setChoosingOpponent(false);start(false,true,true,undefined,id);}}/>}
  </div>;
}
const hitStrength = (effect: number) => effect > 1 ? 24 : effect < 1 ? 10 : 17;
const healthColor = (hp: number) => hp > 45 ? '#7f9e6c' : hp > 20 ? '#dbac48' : '#d97765';
function Health({id,hp,hit,showTypes=false,interactive=true}:{id:number;hp:number;hit?:BattleHit;showTypes?:boolean;interactive?:boolean}) {
  const localize = useT();
  const reduced=useReducedMotion();
  const lost=hit&&hit.after<hit.before;
  const percent=healthPercent(id,hp);
  return <div className="battle-health"><strong>{localize(pokemonById.get(id)!.name)}</strong>{showTypes&&<div className="battle-opponent-types" aria-label={localize(`${pokemonById.get(id)!.name}的属性`)}>{pokemonById.get(id)!.types.map(type=><TypePicture key={type} type={type} interactive={interactive}/>)}</div>}<div className="battle-hp-track" role="progressbar" aria-label={localize(`${pokemonById.get(id)!.name}的体力`)} aria-valuemin={0} aria-valuemax={maxHp(id)} aria-valuenow={hp}><span style={{width:`${percent}%`,background:healthColor(percent)}}/>{lost&&!reduced&&<motion.span className="battle-hp-loss" key={`${hit.before}-${hit.after}`} style={{left:`${healthPercent(id,hit.after)}%`}} initial={{width:`${healthPercent(id,hit.before-hit.after)}%`,opacity:1}} animate={{width:0,opacity:0}} transition={{delay:.45,duration:.7}}/>}</div><small>{localize(hp===0?'休息中':'体力')}</small></div>;
}
function BattleRecap({state,active,openGuide}:{state:BattleState;active:number;openGuide:(state:BattleState)=>void}) {
  const localize=useT();
  const moment=state.moment!;
  const partner=pokemonById.get(active)!;
  const target=pokemonById.get(moment.target)!;
  const factors=moment.move.fallback?[]:target.types.map(type=>({type,value:effectiveness(moment.move.type,[type])}));
  return <section className="battle-recap" aria-label={localize("这一场的小发现")}>
    <h3>{localize(moment.multiplier>1?'刚才这招很有效！':moment.multiplier===1?'刚才这一招打中了！':'这一招效果不显著')}</h3>
    <div className="battle-recap-row">
      <span className="battle-recap-partner"><PokemonArt pokemon={partner}/><b>{localize(partner.name)}</b><span className="battle-recap-types">{partner.types.map(type=><TypePicture type={type} key={type}/>)}</span></span>
      <span className="battle-recap-move"><b>{localize(moment.move.name)}</b>{moment.move.fallback?<small>{localize("特别招式")}</small>:<TypePicture type={moment.move.type}/>}<ArrowRight className="battle-recap-arrow" size={24} aria-hidden="true"/></span>
      <span className="battle-recap-partner"><PokemonArt pokemon={target}/><b>{localize(target.name)}</b><span className="battle-recap-types">{target.types.map(type=><TypePicture type={type} key={type}/>)}</span></span>
    </div>
    {moment.move.fallback?<p>{localize('这次使用了不受属性相克影响的特别招式。')}</p>:<div className="battle-recap-explanation">
      <p>{localize(factors.length===1?'这招对目标属性的效果是：':'对手有两种属性，分别计算再相乘：')}</p>
      <div className="battle-recap-factors">{factors.map(({type,value},index)=><span key={type}>{index>0&&<b aria-hidden="true">×</b>}<span>{localize(TYPE_NAMES[moment.move.type])} → {localize(TYPE_NAMES[type])} <strong>×{localize(multiplierLabel(value))}</strong></span></span>)}</div>
      <p className="battle-recap-total">{localize('这次属性效果 ×')}{localize(multiplierLabel(moment.multiplier))}{localize('。')}</p>
      <button className="button secondary battle-recap-guide" onClick={()=>openGuide(state)}><ArrowRight size={18}/>{localize('去百科看看属性关系')}</button>
    </div>}
  </section>;
}
function Match({presets,team,enemy,again,retry,canChange,audioOwner,initialPartner,tieRandom,next,resumeState,openGuide}:{presets:MovePresets;initialPartner?:number;tieRandom?:number;next:(id:number)=>void;team:number[];enemy:number;again:()=>void;retry:()=>void;canChange:boolean;audioOwner:string;resumeState?:BattleState;openGuide:(state:BattleState)=>void}) {
  const localize = useT();
 const locale=useLocale();
  const [state,dispatch]=useReducer(battleReducer,undefined,()=>resumeState??createNextBattle(team,enemy,initialPartner,tieRandom,presets));
  const [selected,setSelected]=useState<number|null>(null);
  const reduced=useReducedMotion();
  const voice=useId();
  const narration=useSyncExternalStore(subscribeVoice,voiceSnapshot,voiceServerSnapshot);
  const preparingPartner=state.active??selected;
  useEffect(()=>{
    const ids=preparingPartner===null?[enemy]:[preparingPartner,enemy];
    const texts=['打中了！','这招很有效！','效果不显著。','这招没有效果，体力没有减少。'];
    const effects=['/audio/battle/throw.wav'];
    for(const id of ids){
      const name=pokemonById.get(id)!.name;
      texts.push(name,`就决定是你了，${name}！`);
      for(const move of battleMoves(id,id===preparingPartner?state.presets[id]:undefined)){texts.push(`${name}，${move.name}！`);effects.push(`/audio/battle/types/${move.type}.wav`);}
    }
    return prepareBattleAudio([...texts.map(voiceSource).filter((source):source is string=>!!source),...effects]);
  },[enemy,preparingPartner,state.presets,locale]);
  usePlayTimeAnimation(['summon','player','enemy','player-feedback','enemy-feedback'].includes(state.phase) ? `battle:${state.phase}:${state.rounds}` : null);
  const summoning=state.phase==='summon';
  const busy=state.phase==='order'||summoning||state.phase==='player'||state.phase==='enemy'||state.phase==='player-feedback'||state.phase==='enemy-feedback';
  useEffect(()=>{
    if(state.active===null)return;
    // Speak and observe within one effect so even synchronous speech failures settle.
    const actor=state.phase==='enemy'?enemy:state.active;
    const narrationText=state.phase==='order'?pokemonById.get(state.first==='enemy'?enemy:state.active)!.name:
      (state.phase==='player'||state.phase==='enemy')&&locale==='zh'&&!voiceSource(state.message)?pokemonById.get(actor)!.name:state.message;
    if(state.phase!=='ready'&&!(resumeState&&state.phase==='finished'))speakText(voice,narrationText,{loadTimeoutMs:2500});
    if(!busy)return()=>stopVoice(voice);
    let elapsed=false;
    let advanced=false;
    const advance=()=>{if(advanced)return;advanced=true;dispatch({type:'advance'});};
    const check=()=>{if(elapsed&&voiceSnapshot().owner!==voice)advance();};
    const unsubscribe=subscribeVoice(check);
    const minimum=setTimeout(()=>{elapsed=true;check();},state.phase==='order'?2400:summoning?(reduced?350:1800):state.phase.endsWith('feedback')?1300:1500);
    // A device that never completes speech must not freeze the match.
    const fallback=setTimeout(advance,12000);
    return()=>{clearTimeout(minimum);clearTimeout(fallback);unsubscribe();stopVoice(voice);};
  },[busy,state.phase,state.message,state.active,state.first,enemy,reduced,summoning,voice,locale,resumeState]);
  useEffect(()=>{
    if(state.phase==='summon')battleSound(audioOwner,'throw');
    else if(state.phase==='finished'&&!resumeState)battleSound(audioOwner,state.result==='win'?'win':'rest');
    else if((state.phase==='player-feedback'||state.phase==='enemy-feedback')&&state.move&&multiplier(state.move,state.phase==='player-feedback'?enemy:state.active!)>0)battleSound(audioOwner,'hit',state.move.type);
  },[state.phase,state.result,state.move,state.active,enemy,audioOwner,resumeState]);
  const impact=state.phase.endsWith('feedback')&&state.lastHit&&state.lastHit.after<state.lastHit.before;
  const strongImpact=impact&&state.move&&multiplier(state.move,state.lastHit!.target)>1;
  const choose=state.phase==='choose';
  const active=state.active===null?null:pokemonById.get(state.active)!;
  function pick(id:number){dispatch({type:'choose',id,tieRandom:crypto.getRandomValues(new Uint32Array(1))[0]/4294967296});setSelected(null);}
  return <>
    <div className="battle-title"><div className="battle-title-main"><Link href="/team" className="back-link"><ArrowLeft size={18}/>{localize("回小队")}</Link></div>{state.active===null&&canChange?<button className="button secondary battle-change-opponent" onClick={again}><Shuffle size={20} aria-hidden="true"/>{localize("选对手")}</button>:<span>{localize("一对一 · 选定后不换伙伴")}</span>}</div>
    <section className={`battle-arena ${strongImpact&&!reduced?'battle-arena-impact':''} ${choose?'battle-arena-choosing':''} ${state.phase==='finished'?'battle-arena-ended':''}`} aria-label={localize(state.phase==='finished'?'对战结果':'对战场地')}>
      {state.phase==='finished'?<div className={`battle-result-scene ${state.result==='win'?'won':''}`}>
        <span className="battle-result-heading">{localize("对战结束")}</span>
        <div className="battle-winner-art">
          {state.result==='draw'?<><PokemonArt pokemon={active!} sizes="(max-width: 640px) 200px, 320px"/><Handshake size={48} aria-hidden="true"/><PokemonArt pokemon={pokemonById.get(enemy)!} sizes="(max-width: 640px) 200px, 320px"/></>:<><PokemonArt pokemon={state.result==='win'?active!:pokemonById.get(enemy)!} sizes="(max-width: 640px) 200px, 320px"/><span className="battle-trophy" aria-hidden="true"><Trophy size={66}/></span></>}
        </div>
        <strong>{localize(state.result==='win'?`${active!.name}赢啦！`:state.result==='rest'?`${pokemonById.get(enemy)!.name}获胜`:'双方打成平手')}</strong>
        <span>{localize(state.result==='win'?'我们的小队获胜！':state.result==='rest'?'对手获胜，我们下次再加油！':'握握手，下次再切磋！')}</span>
      </div>:<>
      <div className="battle-opponent"><Health id={enemy} hp={state.enemyHp} hit={state.lastHit?.target===enemy&&state.phase==='player-feedback'?state.lastHit:undefined} showTypes interactive={!busy}/><motion.div className="battle-opponent-art" animate={reduced?{}:state.phase==='player-feedback'&&state.move&&multiplier(state.move,enemy)>0?{x:[0,hitStrength(multiplier(state.move,enemy)),-7,4,0]}:state.phase==='enemy'?{x:[0,-14,0]}:state.phase==='ready'&&state.rounds?{x:0}: {x:0}} transition={{duration:.22,ease:"easeOut"}} key={`enemy-${enemy}`}><PokemonArt pokemon={pokemonById.get(enemy)!} sizes="(max-width: 640px) 230px, 360px" />{impact&&state.phase==='player-feedback'&&state.move&&<BattleHitEffect key={state.rounds} move={state.move} strong={!!strongImpact}/>}</motion.div></div>
      <div className={`battle-player ${summoning?'is-summoning':''}`}>{active?<><motion.div className="battle-player-art" key={active.id} animate={reduced?{}:state.phase==='player'?{x:[0,18,0]}:state.phase==='enemy-feedback'&&state.move&&multiplier(state.move,active.id)>0?{x:[0,-hitStrength(multiplier(state.move,active.id)),7,-4,0]}:{x:0}} transition={{duration:.22,ease:"easeOut"}}><PokemonArt pokemon={active} sizes="(max-width: 640px) 230px, 360px" />{impact&&state.phase==='enemy-feedback'&&state.move&&<BattleHitEffect move={state.move} strong={!!strongImpact}/>}</motion.div><Health id={active.id} hp={state.hp[active.id]} hit={state.lastHit?.target===active.id&&state.phase==='enemy-feedback'?state.lastHit:undefined} showTypes interactive={!busy}/></>:<div className="battle-empty">{localize("谁来上场？")}</div>}</div>
      {summoning&&<div className="battle-summon" key={`summon-${state.active}`} aria-hidden="true"><span className="battle-thrown-ball"><CollectionMark state="available"/></span><span className="battle-release-light"/></div>}
      {(state.phase==='player'||state.phase==='enemy')&&state.move&&<BattleMoveEffect key={`${state.phase}-${state.rounds}`} move={state.move} side={state.phase}/>}
      </>}
    </section>
    {active&&state.phase!=='finished'&&<div className={`battle-turn-order ${state.phase==='order'?'is-announcing':''}`} aria-label={localize("每轮出招顺序")}>
      {[state.first==='enemy'?enemy:active.id,state.first==='enemy'?active.id:enemy].map((id,index)=><span className="battle-turn-partner" key={index}>{index===1&&<ArrowRight size={20} aria-hidden="true"/>}<PokemonArt pokemon={pokemonById.get(id)!}/><span><b>{localize(index===0?'先出招':'后出招')} · {localize(pokemonById.get(id)!.name)}</b><small>{localize("速度")}{localize(pokemonById.get(id)!.stats.speed)}</small></span></span>)}
    </div>}
    <div className={`battle-message ${choose?'battle-message-choose':''}`} role="status"><span>{localize(state.message)}</span>{narration.owner===voice&&narration.loading&&<small className="battle-voice-loading">{localize("声音加载中…")}</small>}</div>
    <section className="battle-controls" aria-label={localize("对战操作")}>
      {state.phase==='finished'?<div className="battle-end"><h2>{localize(state.result==='win'?'我们赢啦！':state.result==='draw'?'下次再切磋！':'休息好，再出发！')}</h2>{state.moment&&<BattleRecap state={state} active={active!.id} openGuide={openGuide}/>}<p>{localize("下一场双方都会恢复体力，可以重新选伙伴。")}</p><div><button className="button" onClick={()=>next(active!.id)}><ArrowRight size={19}/>{localize("挑战下一位")}</button><button className="button secondary" onClick={retry}><RotateCcw size={19}/>{localize("换伙伴")}</button><Link href="/team" className="button secondary">{localize("回小队")}</Link></div></div>:choose?<><h2>{localize("选一位伙伴，再点一下就上场")}</h2><div className="battle-choices">{team.map(id=>{
        const partner=pokemonById.get(id)!;
        const hp=state.hp[id];
        const percent=healthPercent(id,hp);
        const resting=hp===0;
        const onField=id===state.active&&!resting;
        const status=resting?'休息中':onField?'正在场上':percent>45?'准备好啦':percent>20?'有点累了':'需要休息';
        return <article key={id} className="battle-choice-card"><button className={`battle-choice-select ${resting?'is-resting':onField?'is-on-field':''}`} disabled={resting||onField} aria-label={localize(`${partner.name}，${status}，体力 ${hp} / ${maxHp(id)}`)} aria-pressed={selected===id} onClick={()=>selected===id?pick(id):setSelected(id)}>
          <PokemonArt pokemon={partner}/><strong>{localize(partner.name)}</strong>
          <span className="battle-choice-health" aria-hidden="true"><span style={{width:`${percent}%`,background:healthColor(percent)}}/></span>
          <small className="battle-choice-status">{localize(selected===id?'再点一下，上场！':status)}</small>
        </button><div className="battle-candidate-types" aria-label={localize(`${partner.name}的属性`)}>{partner.types.map(type=><TypePicture key={type} type={type}/>)}</div><small className="battle-candidate-speed">{localize("速度")}{localize(partner.stats.speed)}</small></article>;
      })}</div></>:active?<><div className="battle-moves">{usableMoves(active.id,enemy,state.presets[active.id]).map(move=><button key={move.id} disabled={busy} className={state.phase==='player'&&state.move?.id===move.id?'is-casting':''} onClick={()=>{ if(state.phase!=='ready')return; if(!reduced&&typeof navigator.vibrate==='function'){try{navigator.vibrate(18);}catch{ /* Optional hardware feedback must not interrupt a turn. */ }} dispatch({type:'attack',moveId:move.id}); }}><strong>{localize(move.name)}</strong>{move.fallback?<small>{localize("特别招式")}</small>:<TypePicture type={move.type} interactive={false}/>}</button>)}</div></>:null}
    </section>
  </>;
}

function OpponentPicker({current,owned,onClose,onPick}:{current:number;owned:number[];onClose:()=>void;onPick:(id?:number)=>void}) {
  const localize = useT();
  const dialog=useRef<HTMLDialogElement>(null);
  const title=useId();
  const [filter,setFilter]=useState<PokemonType|'all'>('all');
  const partners=owned.map(id=>pokemonById.get(id)!).sort((a,b)=>a.id-b.id);
  const types=(Object.keys(TYPE_NAMES) as PokemonType[]).filter(type=>partners.some(p=>p.types.includes(type)));
  const visible=partners.filter(p=>filter==='all'||p.types.includes(filter));
  useEffect(()=>{
    const element=dialog.current;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';element?.showModal();
    return()=>{element?.close();document.body.style.overflow=overflow;};
  },[]);
  return <dialog ref={dialog} className="opponent-dialog" aria-labelledby={title} onCancel={event=>{event.preventDefault();onClose();}}>
    <header><h2 id={title}>{localize("想和谁对战？")}</h2><button className="opponent-close" aria-label={localize("关闭选择对手")} onClick={onClose} autoFocus><X size={24}/></button></header>
    <div className="opponent-picker-tools">
      <button className="button secondary" onClick={()=>onPick()}><Shuffle size={20}/>{localize("随机选一位")}</button>
      <div className="opponent-filters" role="group" aria-label={localize("按属性筛选对手")}>
        <button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>{localize("全部")}</button>
        {types.map(type=><button key={type} className={`type-picture type-${type}`} aria-label={localize(`${TYPE_NAMES[type]}属性`)} aria-pressed={filter===type} onClick={()=>setFilter(type)}><TypeSymbol type={type} size={24}/><span>{localize(TYPE_NAMES[type])}</span></button>)}
      </div>
    </div>
    <div className="opponent-picker-list" key={filter}>
      <p className="opponent-count" role="status">{localize("已收集的伙伴 ·")}{localize(visible.length)}{localize("位")}</p>
      <div className="opponent-grid">{visible.map(p=><button key={p.id} aria-label={localize(`选择${p.name}${p.id===current?'，当前对手':''}`)} aria-pressed={p.id===current} onClick={()=>onPick(p.id)}><PokemonArt pokemon={p}/><strong>{localize(p.name)}</strong>{p.id===current&&<small>{localize("当前对手")}</small>}</button>)}</div>
    </div>
  </dialog>;
}
