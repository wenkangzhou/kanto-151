'use client';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { pokemonById } from '@/domain/pokemon';
import { reorderTeam } from '@/domain/navigation';
import { PokemonArt } from './pokemon-art';
import { useCollection } from './collection-provider';

type Drag = { id: number; pointer: number; x: number; y: number; active: boolean; expected: number[]; order: number[]; boxes: DOMRect[]; inside: boolean };
export function TeamSlots({ team, disabled, edit, notify }: { team: number[]; disabled: boolean; edit: (slot: number) => void; notify: (message: string) => void }) {
  const { saveTeam, refresh } = useCollection();
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<Drag | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<number[] | null>(null);
  const [ghost, setGhost] = useState<{ id: number; x: number; y: number } | null>(null);
  const reduced = useReducedMotion();
  const order = draft ?? team;
  const clearTimer = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = null; }, []);
  const cancel = useCallback(() => { clearTimer(); gesture.current = null; setGhost(null); if (!saving.current) setDraft(null); }, [clearTimer]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    const blur = () => cancel();
    window.addEventListener('keydown', escape); window.addEventListener('blur', blur);
    return () => { clearTimer(); window.removeEventListener('keydown', escape); window.removeEventListener('blur', blur); };
  }, [cancel, clearTimer]);
  async function commit(next: number[], expected: number[]) {
    if (saving.current) return;
    if (next.join() === expected.join()) { setDraft(null); notify(''); return; }
    saving.current = true; setBusy(true); setDraft(next); notify('正在保存小队顺序…');
    try { await saveTeam(next, expected); notify('小队排好啦！'); }
    catch (error) { notify(error instanceof Error ? error.message : '顺序没有保存，请再试一次。'); await refresh(); }
    finally { saving.current = false; setBusy(false); setDraft(null); }
  }
  function start(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (disabled || saving.current || team.length < 2 || !event.isPrimary || event.button !== 0) return;
    clearTimer();
    const boxes = Array.from(root.current!.querySelectorAll<HTMLElement>('[data-team-id]')).map(el => el.getBoundingClientRect());
    const drag: Drag = { id, pointer: event.pointerId, x: event.clientX, y: event.clientY, active: false, expected: [...team], order: [...team], boxes, inside: true };
    gesture.current = drag;
    root.current!.setPointerCapture(event.pointerId);
    const activate = () => {
      drag.active = true; setDraft(drag.order); setGhost({ id, x: drag.x, y: drag.y });
      notify(`正在移动${pokemonById.get(id)!.name}，松手放好。`);
    };
    if (event.pointerType === 'mouse') activate();
    else timer.current = setTimeout(activate, 350);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    if (!drag.active) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 10) cancel();
      return;
    }
    setGhost({ id: drag.id, x: event.clientX, y: event.clientY });
    const bounds = root.current!.getBoundingClientRect();
    drag.inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (!drag.inside) return;
    const distances = drag.boxes.map(box => Math.hypot(event.clientX - (box.x + box.width / 2), event.clientY - (box.y + box.height / 2)));
    const slot = distances.indexOf(Math.min(...distances));
    const next = reorderTeam(drag.order, drag.id, slot);
    if (next.join() !== drag.order.join()) { drag.order = next; setDraft(next); }
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    clearTimer(); gesture.current = null; setGhost(null);
    if (drag.active && drag.inside) void commit(drag.order, drag.expected);
    else { setDraft(null); if (drag.active) notify('已取消移动。'); }
  }
  return <><div className="team-slots" ref={root} aria-busy={busy} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={() => { if (gesture.current) cancel(); }}>{Array.from({ length: 6 }, (_, slot) => {
    const p = pokemonById.get(order[slot]);
    return <motion.article layout={reduced ? false : 'position'} transition={{ duration: .18 }} data-team-id={p?.id} className={`team-slot ${p ? 'occupied' : ''} ${ghost?.id === p?.id && p ? 'team-dragging' : ''}`} key={p?.id ?? `empty-${slot}`}>
      <span className="team-slot-number">{String(slot + 1).padStart(2, '0')}</span>
      {p ? <><button className="team-partner-art team-drag-handle" disabled={disabled || busy || team.length < 2} aria-label={`移动${p.name}，当前位置${slot + 1}`} aria-describedby="team-sort-hint" onPointerDown={event => start(event, p.id)} onContextMenu={event => event.preventDefault()} onKeyDown={event => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key) || saving.current || gesture.current) return;
        event.preventDefault();
        const to = slot + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1);
        void commit(reorderTeam(team, p.id, to), [...team]);
      }}><PokemonArt pokemon={p} /></button><strong>{p.name}</strong><button className="team-change" disabled={disabled || busy || Boolean(ghost)} onClick={() => edit(slot)}><ArrowLeftRight size={18} />换伙伴</button></> : <button className="team-empty" disabled={disabled || busy || Boolean(ghost)} onClick={() => edit(team.length)} aria-label={`邀请伙伴，位置${slot + 1}`}><span className="empty-ball"><Plus size={32} /></span><strong>一起出发</strong></button>}
    </motion.article>;
  })}</div><p id="team-sort-hint" className="team-sort-hint">长按伙伴，拖动换位置<span className="sr-only">。键盘可聚焦伙伴后用方向键调整顺序，Escape 取消拖动。</span></p>{ghost && <div className="team-drag-ghost" aria-hidden="true" style={{ left: ghost.x, top: ghost.y }}><PokemonArt pokemon={pokemonById.get(ghost.id)!} /></div>}</>;
}
