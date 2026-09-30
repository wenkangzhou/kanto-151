'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Check, X, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import {api} from '@/lib/api-client';
import {MACHINE_STAR_COST,type LearningState} from '@/domain/learning';
import { machineAvailable, resolvedSlots, slotMoves, type MoveSlots } from '@/domain/battle-loadout';
import { pokemonById } from '@/domain/pokemon';
import { useCollection } from './collection-provider';
import { PokemonArt } from './pokemon-art';
import { TypePicture } from './type-badge';

export function MovePicker({ id, onClose }: { id: number; onClose: () => void }) {
  const { snapshot, saveMoves, refresh } = useCollection();
  const partner = pokemonById.get(id)!;
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const saving = useRef(false);
  const title = useId();
  const [slot, setSlot] = useState<number | null>(null);
  const [learning,setLearning]=useState<LearningState|null>(null);
  const [lockedMove,setLockedMove]=useState<string|null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [failed,setFailed]=useState(false);
  const [saved, setSaved] = useState<MoveSlots>(() => resolvedSlots(id, snapshot.movePresets?.[id]));
  const expected = useRef(snapshot.movePresets?.[id] ?? null);
  const slotButtons = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    let mounted=true;
    api<LearningState>('learning').then(value=>{if(mounted)setLearning(value);}).catch(()=>{if(mounted)setError('学习星暂时无法读取，已开放招式仍可使用。');});
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; element?.showModal();
    return () => { mounted=false;element?.close(); document.body.style.overflow = overflow; };
  }, []);
  function chooseSlot(index: number) { setSlot(index);setLockedMove(null); setNotice(''); setError(''); }
  async function unlockMove(){
    if(!lockedMove||saving.current)return;saving.current=true;setBusy(true);setError('');
    try{const next=await api<LearningState>('learning',{action:'unlock',pokemonId:id,moveId:lockedMove,requestId:crypto.randomUUID()});setLearning(next);await refresh();setLockedMove(null);setNotice('已兑换，点一下即可装备');}
    catch(e){setError(e instanceof Error?e.message:'请重试。');}finally{saving.current=false;setBusy(false);}
  }
  useEffect(() => { if (slot !== null) back.current?.focus(); }, [slot]);
  function returnToSlots(index: number) {
    setSlot(null);
    requestAnimationFrame(() => slotButtons.current[index]?.focus());
  }
  async function replace(moveId: string) {
    if (slot === null || saving.current || failed) return;
    const index = slot;
    if (saved[index] === moveId) { returnToSlots(index); return; }
    if (saved.includes(moveId) || !slotMoves(id,index).some(m=>m.id===moveId)) return;
    saving.current = true; setBusy(true); setError('');
    const next: MoveSlots = [...saved]; next[index] = moveId;
    try {
      await saveMoves(id,next,expected.current);
      expected.current = next; setSaved(next); setNotice('已保存'); returnToSlots(index);
    } catch (err) {
      setFailed(true);setError(err instanceof Error ? err.message : '没有保存成功，请重试。');
      await refresh();
    } finally { saving.current = false; setBusy(false); }
  }
  const candidates = slot === null ? [] : slotMoves(id,slot);
  return <dialog ref={dialog} className="loadout-dialog" aria-labelledby={title} onCancel={event=>{event.preventDefault();if(!saving.current){if(slot!==null)returnToSlots(slot);else onClose();}}}>
    <header><h2 id={title}>{slot === null ? `${partner.name}的招式` : slot >= 2 ? '技能机招式' : '升级招式'}</h2><button className="opponent-close" disabled={busy} aria-label="关闭招式设置" onClick={onClose} autoFocus><X size={24}/></button></header>
    <div className="loadout-dialog-content">
      {slot === null ? <>
        <div className="loadout-dialog-partner"><PokemonArt pokemon={partner}/></div>
        <div className="move-slot-grid">{saved.map((moveId,index)=>{
          const move=slotMoves(id,index).find(m=>m.id===moveId);
          const available=slotMoves(id,index).length>0;
          return <button key={index} ref={element=>{slotButtons.current[index]=element;}} aria-label={`更换${index>=2?'技能机':`第${index+1}个升级`}招式${move?`，${move.name}`:''}`} disabled={!available||busy} onClick={()=>chooseSlot(index)}>
            <small>{index>=2?`技能机 ${index-1}`:`升级 ${index+1}`}</small><div><strong>{move?.name??'空位'}</strong>{move&&<TypePicture type={move.type} interactive={false}/>}</div>
          </button>;
        })}</div>
        {!saved.some(Boolean)&&<p className="loadout-dialog-hint">对战时使用「挣扎」</p>}

      </> : <>
        <button ref={back} className="back-link" disabled={busy} onClick={()=>returnToSlots(slot)}><ArrowLeft size={18}/>返回</button>
        {slot>=2&&<div className="learning-target"><strong>⭐ {learning?.balance??'—'}</strong>{lockedMove&&<><span>{candidates.find(m=>m.id===lockedMove)?.name} · {MACHINE_STAR_COST} ⭐</span>{(learning?.balance??0)>=MACHINE_STAR_COST?<button className="button" disabled={busy} onClick={()=>void unlockMove()}>{MACHINE_STAR_COST} ⭐ 兑换</button>:<Link className="button" href="/learn" onClick={onClose}>去学习攒星星</Link>}</>}</div>}
        <div className="move-candidate-grid">{candidates.map(move=>{
          const current=saved[slot]===move.id;
          const occupied=!current&&saved.includes(move.id);
          const locked=slot>=2&&!current&&!machineAvailable(id,move.id,learning?.unlocked??snapshot.unlockedMoves);
          return <button key={move.id} disabled={busy||failed||occupied} aria-pressed={current} onClick={()=>{if(locked){setLockedMove(move.id);}else void replace(move.id);}}>
            <div><strong>{move.name}</strong><TypePicture type={move.type} interactive={false}/></div>
            <small>{current?<><Check size={14}/>正在使用</>:occupied?'已装备':locked?<><LockKeyhole size={14}/>{MACHINE_STAR_COST} ⭐</>:slot>=2?'已开放':move.level===0?'进化':`Lv.${move.level}`}</small>
          </button>;
        })}</div>
      </>}
    </div>
    {(busy||error||notice)&&<footer aria-live="polite">{busy?'正在保存…':error||notice}{failed&&<button className="button secondary" onClick={onClose}>返回小队</button>}</footer>}
  </dialog>;
}
