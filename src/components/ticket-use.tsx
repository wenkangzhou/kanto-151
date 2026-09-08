'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useCollection } from './collection-provider';
import { api } from '@/lib/api-client';
import { evolutionOptions, legendaryEligible } from '@/domain/collection';
import { pokemon, pokemonById, dexNumber } from '@/domain/pokemon';
import type { Receipt } from '@/domain/types';
import { PokemonArt } from './pokemon-art';
import { TypeBadge } from './type-badge';
export function TicketUse() {
  const { live, tickets, snapshot } = useCollection(); const router = useRouter();
  const [ticketId, setTicketId] = useState(''); const [targetId, setTargetId] = useState<number | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  if (!live || !tickets.length) return null;
  const ticket = tickets.find(ticket => ticket.id === ticketId) ?? tickets[0];
  const options = ticket.type === 'evolution' ? evolutionOptions(snapshot) : pokemon.filter(p => p.id !== 151 && legendaryEligible(p.id, snapshot));
  const selected = options.find(p => p.id === targetId);
  async function activateTicket() {
    if (!selected || busy) return; setBusy(true); setError('');
    try { const receipt = await api<Receipt>('tickets/use', { ticketId: ticket.id, targetId: selected.id }); router.push(`/capture?receipt=${receipt.id}`); }
    catch (error) { setError(error instanceof Error ? error.message : '请重试。'); setBusy(false); }
  }
  return <section className="detail-panel ticket-use"><div className="section-heading"><h2><Sparkles size={20} />把一张券变成新的相遇</h2></div><label className="ticket-select">选择要使用的券<select value={ticket.id} disabled={busy} onChange={event => { setTicketId(event.target.value); setTargetId(null); setError(''); }}>{tickets.map(ticket => <option key={ticket.id} value={ticket.id}>{ticket.type === 'evolution' ? '进化券' : '传说券'} · {ticket.reason || '一次值得记住的努力'} · {new Date(ticket.createdAt).toLocaleDateString('zh-CN')}</option>)}</select></label><p className="ticket-reason">「{ticket.reason || '一次值得记住的努力'}」</p>{options.length ? <><p className="form-note">{ticket.type === 'evolution' ? '选择一个新形态。原来的伙伴会保留；伊布可以分别选择水、电、火三种形态。' : '这些传说相遇已经达到条件，选择一位伙伴吧。'}</p><div className="ticket-options" role="group" aria-label="选择相遇的宝可梦">{options.map(p => <button disabled={busy} className={selected?.id === p.id ? 'selected' : ''} aria-pressed={selected?.id === p.id} key={p.id} onClick={() => setTargetId(p.id)}><PokemonArt pokemon={p} hidden /><span className="mono">{dexNumber(p.id)}</span><strong>{p.evolvesFrom ? `${pokemonById.get(p.evolvesFrom)!.name}的新模样` : '神秘的传说伙伴'}</strong><span className="badge-list">{p.types.map(type => <TypeBadge key={type} type={type} />)}</span></button>)}</div>{selected && <div className="ticket-confirm"><p>使用这张{ticket.type === 'evolution' ? '进化券' : '传说券'}，与 {dexNumber(selected.id)} 相遇。</p><button className="button" disabled={busy} onClick={() => void activateTicket()}>{busy ? '正在保存新的相遇…' : '确认，开启相遇'}</button></div>}</> : <p className="strength-summary">暂时没有符合条件的新伙伴。这张券会一直留在背包里，等你准备好。</p>}{error && <p role="alert" className="form-error">{error}</p>}</section>;
}
