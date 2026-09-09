'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, ArrowRight, BookOpen, Check, House, Plus, UsersRound, X } from 'lucide-react';
import { pokemonById } from '@/domain/pokemon';
import { useCollection } from './collection-provider';
import { PokemonArt } from './pokemon-art';

const slots = [0, 1, 2, 3, 4, 5];
export function TeamPreview() {
  const { snapshot } = useCollection();
  const team = snapshot.team ?? [];
  return <Link href="/team" className="team-preview" aria-label={`我的小队，${team.length}位伙伴，前往组队`}>
    <span className="team-preview-heading"><UsersRound size={24} /><strong>我的小队</strong><span>{team.length} / 6</span><ArrowRight size={22} /></span>
    <span className="team-preview-slots">{slots.map(slot => <span key={slot}>{team[slot] ? <PokemonArt pokemon={pokemonById.get(team[slot])!} /> : <Plus size={24} />}</span>)}</span>
  </Link>;
}

export function Team() {
  const { snapshot, live } = useCollection();
  const team = snapshot.team ?? [];
  const center = snapshot.records.filter(record => !team.includes(record.pokemonId));
  const [editing, setEditing] = useState<{ slot: number; expected: number[] } | null>(null);
  const [notice, setNotice] = useState('');
  const edit = (slot: number) => { setNotice(''); setEditing({ slot, expected: [...team] }); };
  return <div className="page team-page">
    <div className="page-heading"><div><div className="eyebrow">LET’S GO TOGETHER</div><h1>我的小队<span className="title-dot">.</span></h1><p>选六位伙伴，一起出发吧。</p></div><span className="team-count"><UsersRound size={24} />{team.length} / 6</span></div>
    {!live && <p className="team-demo-note">这里是示例伙伴。连接家庭后，就能选择自己的小队。</p>}
    <section className="team-camp" aria-label="六个随行位置"><div className="team-slots">{slots.map(slot => {
      const p = pokemonById.get(team[slot]);
      return <article className={`team-slot ${p ? 'occupied' : ''}`} key={slot}>
        <span className="team-slot-number">{String(slot + 1).padStart(2, '0')}</span>
        {p ? <><div className="team-partner-art"><PokemonArt pokemon={p} /></div><strong>{p.name}</strong><button className="team-change" disabled={!live} onClick={() => edit(slot)}><ArrowLeftRight size={18} />换伙伴</button></> : <button className="team-empty" disabled={!live} onClick={() => edit(team.length)} aria-label={`邀请伙伴，位置${slot + 1}`}><span className="empty-ball"><Plus size={32} /></span><strong>一起出发</strong></button>}
      </article>;
    })}</div></section>
    <p className="team-notice" role="status">{notice}</p>
    <section className="pokemon-center"><div className="section-heading"><div className="center-heading"><span className="center-sign" aria-hidden="true"><House size={29} /><Plus size={15} /></span><div><h2>精灵中心 <small>{center.length}</small></h2><p>伙伴们在这里休息，随时可以一起出发。</p></div></div>{live && center.length > 0 && <button className="button secondary" onClick={() => { document.querySelector('.team-camp')?.scrollIntoView({ behavior: 'auto', block: 'center' }); setNotice(team.length < 6 ? '点上面的空位，邀请伙伴。' : '点小队里的“换伙伴”，选择谁一起出发。'); }}><UsersRound size={20} />组队</button>}</div>
      {center.length ? <div className="center-grid">{center.map(({ pokemonId }) => { const p = pokemonById.get(pokemonId)!; return <article key={p.id} className={`center-partner card-${p.types[0]}`}><div className="team-partner-art"><PokemonArt pokemon={p} /></div><strong>{p.name}</strong><Link href={`/pokemon/${p.id}`} aria-label={`查看${p.name}的图鉴`}><BookOpen size={16} />图鉴</Link></article>; })}</div> : <div className="empty-state compact"><House size={34} /><h3>{team.length ? '伙伴们都在小队里' : '伙伴们还在路上'}</h3>{!snapshot.records.length && <Link href="/capture" className="button">打开奖励 <ArrowRight size={20} /></Link>}</div>}
    </section>
    {editing && <TeamPicker slot={editing.slot} expected={editing.expected} onClose={() => setEditing(null)} onDone={message => { setNotice(message); setEditing(null); }} />}
  </div>;
}

function TeamPicker({ slot, expected, onClose, onDone }: { slot: number; expected: number[]; onClose: () => void; onDone: (message: string) => void }) {
  const { snapshot, saveTeam, refresh } = useCollection();
  const dialog = useRef<HTMLDialogElement>(null);
  const saving = useRef(false);
  const [candidate, setCandidate] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);
  const current = pokemonById.get(expected[slot]);
  const chosen = candidate ? pokemonById.get(candidate) : null;
  const available = snapshot.records.filter(record => !expected.includes(record.pokemonId));
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  async function commit(remove = false) {
    if (saving.current || failed || (!remove && !chosen)) return;
    saving.current = true; setBusy(true); setError('');
    const next = remove ? expected.filter((_, index) => index !== slot) : [...expected];
    if (!remove) next[slot] = candidate!;
    try { await saveTeam(next, expected); onDone(remove ? `${current!.name}回精灵中心休息啦。` : `${chosen!.name}加入小队啦！`); }
    catch (err) { setFailed(true); setError(err instanceof Error ? err.message : '暂时没有完成，请重新选择。'); await refresh(); }
    finally { saving.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} className="team-dialog" aria-labelledby="team-picker-title" onCancel={event => { event.preventDefault(); if (!saving.current) onClose(); }}>
    <div className="team-dialog-heading"><h2 id="team-picker-title">{current ? '换谁一起出发？' : '邀请一位伙伴'}</h2><button aria-label="关闭选择" disabled={busy} onClick={onClose}><X size={24} /></button></div>
    <div className="team-dialog-content">
      {current && <div className="team-current"><PokemonArt pokemon={current} /><strong>{current.name}</strong><button className="button secondary" disabled={busy || failed} onClick={() => void commit(true)}><House size={20} />回精灵中心</button></div>}
      {available.length ? <div className="team-choices">{available.map(({ pokemonId }) => { const p = pokemonById.get(pokemonId)!; return <button key={p.id} disabled={busy || failed} aria-pressed={candidate === p.id} className={candidate === p.id ? 'selected' : ''} onClick={() => setCandidate(p.id)}><PokemonArt pokemon={p} /><strong>{p.name}</strong>{candidate === p.id && <Check className="team-choice-check" size={22} />}</button>; })}</div> : <p className="team-no-choice">精灵中心暂时没有其他伙伴。可以先打开奖励，认识新伙伴。</p>}
    </div>
    <div className="team-dialog-footer">
      {chosen && <div className="team-swap-preview">{current ? <><PokemonArt pokemon={current} /><ArrowLeftRight size={24} /></> : <Plus size={24} />}<PokemonArt pokemon={chosen} /><span>{current ? `${current.name}回中心` : '一起出发' }<strong>{chosen.name}加入小队</strong></span></div>}
      {error && <p className="team-error" role="alert">{error}</p>}
      {failed ? <button className="button" disabled={busy} onClick={onClose}>返回小队，重新选择</button> : <button className="button" disabled={!chosen || busy} onClick={() => void commit()}>{busy ? '正在安排…' : current ? '交换伙伴' : '一起出发'}<ArrowRight size={21} /></button>}
    </div>
  </dialog>;
}
