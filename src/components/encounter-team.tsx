'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, ArrowRight, Check, House, UsersRound, X } from 'lucide-react';
import { pokemonById } from '@/domain/pokemon';
import type { Pokemon } from '@/domain/types';
import { useCollection } from './collection-provider';
import { PokemonArt } from './pokemon-art';

export function EncounterTeam({ partner, previousId, disabled }: { partner: Pokemon; previousId?: number | null; disabled: boolean }) {
  const { snapshot } = useCollection();
  const team = snapshot.team ?? [];
  const [selection, setSelection] = useState<number[] | null>(null);
  const owned = snapshot.records.some(record => record.pokemonId === partner.id);
  if (team.includes(partner.id)) return <p className="encounter-team-saved" role="status"><Check size={20} />已经在小队里，一起出发吧！</p>;
  return <div className="encounter-team"><button className="button" disabled={disabled || !owned} onClick={() => setSelection([...team])}><UsersRound size={24} />加入小队<ArrowRight size={20} /></button><p><House size={16} />也可以先留在精灵中心，随时再邀请。</p>{selection && <InviteDialog partner={partner} previousId={previousId} expected={selection} onClose={() => setSelection(null)} />}</div>;
}

export function InviteDialog({ partner, previousId, expected, onClose, onDone }: { partner: Pokemon; previousId?: number | null; expected: number[]; onClose: () => void; onDone?: () => void }) {
  const { saveTeam, refresh } = useCollection();
  const preferred = previousId ? expected.indexOf(previousId) : -1;
  const [slot, setSlot] = useState<number | null>(preferred >= 0 ? preferred : expected.length < 6 ? expected.length : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);
  const saving = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const leaving = slot !== null ? pokemonById.get(expected[slot]) : null;
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  async function confirm() {
    if (slot === null || saving.current || failed) return;
    saving.current = true; setBusy(true);
    const next = [...expected]; next[slot] = partner.id;
    try { await saveTeam(next, expected); onDone?.(); onClose(); }
    catch (err) { setFailed(true); setError(err instanceof Error ? err.message : '请重新选择伙伴。'); await refresh(); }
    finally { saving.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} className="team-dialog invite-dialog" aria-labelledby="invite-title" onCancel={event => { event.preventDefault(); if (!saving.current) onClose(); }}>
    <div className="team-dialog-heading"><h2 id="invite-title">{preferred >= 0 ? '让新模样一起出发？' : expected.length === 6 ? '谁回中心休息？' : '一起出发吧！'}</h2><button aria-label="关闭入队选择" disabled={busy} onClick={onClose}><X size={24} /></button></div>
    <div className="team-dialog-content"><div className="invite-preview">{leaving && <><div><PokemonArt pokemon={leaving} /><strong>{leaving.name}</strong><small><House size={16} />回精灵中心</small></div><ArrowLeftRight size={28} /></>}<div><PokemonArt pokemon={partner} /><strong>{partner.name}</strong><small><UsersRound size={16} />加入小队</small></div></div>
      {expected.length > 0 && <><p className="invite-instruction">{expected.length === 6 ? '小队有六位伙伴了，选一位回中心。' : '可以使用空位，也可以接替一位伙伴。'}</p><div className="team-choices">{expected.map((id, index) => { const p = pokemonById.get(id)!; return <button key={id} disabled={busy || failed} aria-label={`让${p.name}回中心`} aria-pressed={slot === index} className={slot === index ? 'selected' : ''} onClick={() => setSlot(index)}><PokemonArt pokemon={p} /><strong>{p.name}</strong>{slot === index && <Check className="team-choice-check" size={22} />}</button>; })}{expected.length < 6 && <button disabled={busy || failed} aria-pressed={slot === expected.length} className={slot === expected.length ? 'selected invite-empty' : 'invite-empty'} onClick={() => setSlot(expected.length)}><UsersRound size={35} /><strong>使用空位</strong>{slot === expected.length && <Check className="team-choice-check" size={22} />}</button>}</div></>}
    </div><div className="team-dialog-footer">{error && <p className="team-error" role="alert">{error}</p>}<button className="button secondary" disabled={busy} onClick={onClose}>{failed ? '返回并重新选择' : '先留在中心'}</button>{!failed && <button className="button" disabled={busy || slot === null} onClick={() => void confirm()}>{busy ? '正在安排…' : leaving ? '确认交换' : '一起出发'}<ArrowRight size={20} /></button>}</div>
  </dialog>;
}
