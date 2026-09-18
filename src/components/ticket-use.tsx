'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Sparkles, Ticket, Mountain, LockKeyhole } from 'lucide-react';
import { useCollection } from './collection-provider';
import { api, RequestError } from '@/lib/api-client';
import { evolutionOptions, legendaryEligible } from '@/domain/collection';
import { pokemon, pokemonById, dexNumber } from '@/domain/pokemon';
import type { Pokemon, Receipt, CollectionSnapshot, InventoryTicket } from '@/domain/types';
import { PokemonArt } from './pokemon-art';
import { TypePicture } from './type-badge';
import { ticketEntry } from '@/domain/ticket-navigation';

function Transformation({ target }: { target: Pokemon }) {
  const parent = target.evolvesFrom ? pokemonById.get(target.evolvesFrom) : null;
  return <div className="transformation">{parent ? <><div><PokemonArt pokemon={parent} /><span>{parent.name}</span></div><ArrowRight className="transform-arrow" size={25} aria-hidden="true" /></> : <Mountain className="transform-mountain" size={38} aria-hidden="true" />}<div><PokemonArt pokemon={target} hidden /><span>{dexNumber(target.id)} · 新伙伴</span></div></div>;
}
export function TicketUse({ preview, initialType }: { initialType?: InventoryTicket['type']; preview?: { snapshot: CollectionSnapshot; tickets: InventoryTicket[]; onUse: (target: Pokemon) => void } } = {}) {
  const collection = useCollection(); const router = useRouter();
  const { live, tickets, snapshot } = preview ? { live: true, ...preview } : collection;
  const initial = ticketEntry(tickets, initialType);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const visibleTickets = ticketEntry(tickets, typeFilter).matching;
  const scrollRequested = useRef(Boolean(initialType));
  const section = useRef<HTMLElement>(null);
  const submitting = useRef(false);
  function goToStep(next: number) {
    setStep(next);
    scrollRequested.current = true;
  }
  const [step, setStep] = useState(initial.selectedId ? 2 : 1);
  const [ticketId, setTicketId] = useState(initial.selectedId); const [targetId, setTargetId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false); const [retrying, setRetrying] = useState(false); const [error, setError] = useState('');
  useLayoutEffect(() => {
    if (!scrollRequested.current) return;
    const frame = requestAnimationFrame(() => {
      section.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      section.current?.focus({ preventScroll: true });
      scrollRequested.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [step, ticketId]);
  if (!live || !tickets.length) return null;
  const ticket = tickets.find(item => item.id === ticketId);
  const options = !ticket ? [] : ticket.type === 'evolution' ? evolutionOptions(snapshot) : pokemon.filter(p => p.id !== 151 && legendaryEligible(p.id, snapshot));
  const selected = options.find(p => p.id === targetId);
  const activeStep = !ticket ? 1 : step === 3 && !selected ? 2 : step;
  async function activateTicket() {
    if (!ticket || !selected || submitting.current) return;
    submitting.current = true;
    if (preview) { preview.onUse(selected); return; }
    setBusy(true); setError(''); setRetrying(true);
    try { const receipt = await api<Receipt>('tickets/use', { ticketId: ticket.id, targetId: selected.id }); await collection.refresh(); router.push(`/capture?receipt=${receipt.id}`); }
    catch (error) {
      setError(error instanceof Error ? error.message : '请重试。');
      if (error instanceof RequestError && error.status >= 400 && error.status < 500) setRetrying(false);
      submitting.current = false;
      setBusy(false);
    }
  }
  return <section ref={section} className="detail-panel ticket-journey" id="use-ticket" tabIndex={-1} aria-label="使用背包奖励券">
    <div className="section-heading"><h2><Sparkles size={23} /> 打开背包里的惊喜</h2></div>
    <ol className="journey-steps" aria-label="使用奖励券的步骤">{[{ Icon: Ticket, title: '选一张券' }, { Icon: Sparkles, title: '选伙伴' }, { Icon: Check, title: '确认' }].map(({ Icon, title }, index) => <li key={title} aria-current={activeStep === index + 1 ? 'step' : undefined} className={activeStep >= index + 1 ? 'reached' : ''}><span><Icon size={24} aria-hidden="true" /></span><b>{title}</b>{index < 2 && <ArrowRight size={19} aria-hidden="true" />}</li>)}</ol>
    <div className="journey-content" key={activeStep}>
    {activeStep === 1 && <><h3>点一张，看看里面的惊喜</h3><div className="picture-tickets" role="group" aria-label="选择奖励券">{visibleTickets.map(item => <button type="button" key={item.id} aria-pressed={ticketId === item.id} className={`picture-ticket ${item.type} ${ticketId === item.id ? 'chosen' : ''}`} onClick={() => { setTicketId(item.id); setTargetId(null); setError(''); setRetrying(false); goToStep(2); }}><span className="ticket-check">{ticketId === item.id ? <Check size={20} /> : <Ticket size={20} />}</span>{item.type === 'evolution' ? <Sparkles size={46} /> : <Mountain size={46} />}<strong>{item.type === 'evolution' ? '进化券' : '传说券'}</strong><span className="picture-ticket-reason">{item.reason || '一次值得记住的努力'}</span><small>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</small></button>)}</div>{typeFilter && <button className="text-link" onClick={() => setTypeFilter(undefined)}>看看所有奖励券</button>}</>}
    {activeStep === 2 && ticket && <><h3>{ticket.type === 'evolution' ? '想看看谁的新模样？' : '想和哪位神秘伙伴相遇？'}</h3>{options.length ? <><div className="picture-partners" role="group" aria-label="选择新伙伴">{options.map(target => <div className={`picture-partner ${selected?.id === target.id ? 'chosen' : ''}`} key={target.id}><button type="button" className="picture-partner-choice" aria-pressed={selected?.id === target.id} onClick={() => { setTargetId(target.id); goToStep(3); }}><span className="partner-check">{selected?.id === target.id ? <Check size={22} /> : <Sparkles size={20} />}</span><Transformation target={target} /></button><span className="partner-type-pictures">{target.types.map(type => <TypePicture type={type} key={type} />)}</span></div>)}</div>{ticket.type === 'evolution' && <p className="form-note">原来的伙伴会留下，新模样也会加入图鉴。</p>}</> : <div className="ticket-wait"><LockKeyhole size={38} /><h4>惊喜先留在背包里</h4><p>{ticket.type === 'evolution' ? '再认识一些伙伴，就有机会发现新的模样。' : '再收集一些伙伴，远方的传说就会开启。'}这张券没有被使用。</p></div>}<div className="journey-actions">{tickets.length > 1 && <button className="button secondary" onClick={() => { setTypeFilter(undefined); goToStep(1); }}><ArrowLeft size={19} /> 换张券</button>}</div></>}
    {activeStep === 3 && ticket && selected && <div className="journey-confirm"><h3>{selected.evolvesFrom ? '一起迎接新模样！' : '新的相遇，准备好了！'}</h3><Transformation target={selected} /><div className={`confirmation-ticket ${ticket.type}`}><Ticket size={28} /><span>1 张{ticket.type === 'evolution' ? '进化券' : '传说券'}</span><ArrowRight size={23} /><Sparkles size={28} /><span>1 位新伙伴</span></div><p className="confirmation-reason">「{ticket.reason || '一次值得记住的努力'}」</p>{error && <p role="alert" className="form-error">{error}</p>}{retrying && !busy && <p className="form-note">可以重试同一次相遇，不会重复用券。刷新后也可以在首页找到已保存的结果。</p>}<div className="journey-actions">{!retrying && <button className="button secondary" disabled={busy} onClick={() => goToStep(2)}><ArrowLeft size={19} /> 再选选</button>}<button className="button" disabled={busy} onClick={() => void activateTicket()}><Sparkles size={23} />{busy ? '正在打开惊喜…' : retrying ? '重新打开这次相遇' : ticket.type === 'evolution' ? '使用进化券，开始进化！' : '使用传说券，开始相遇！'}</button></div><p className="form-note">确认后使用 1 张券，直接开始动画。</p></div>}
    </div>
  </section>;
}
