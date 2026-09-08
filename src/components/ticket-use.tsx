'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Sparkles, Ticket, Mountain, LockKeyhole } from 'lucide-react';
import { useCollection } from './collection-provider';
import { api, RequestError } from '@/lib/api-client';
import { evolutionOptions, legendaryEligible } from '@/domain/collection';
import { pokemon, pokemonById, dexNumber } from '@/domain/pokemon';
import type { Pokemon, Receipt } from '@/domain/types';
import { PokemonArt } from './pokemon-art';
import { TypePicture } from './type-badge';

function Transformation({ target }: { target: Pokemon }) {
  const parent = target.evolvesFrom ? pokemonById.get(target.evolvesFrom) : null;
  return <div className="transformation">{parent ? <><div><PokemonArt pokemon={parent} /><span>{parent.name}</span></div><ArrowRight className="transform-arrow" size={25} aria-hidden="true" /></> : <Mountain className="transform-mountain" size={38} aria-hidden="true" />}<div><PokemonArt pokemon={target} hidden /><span>{dexNumber(target.id)} · 新伙伴</span></div></div>;
}
export function TicketUse() {
  const { live, tickets, snapshot } = useCollection(); const router = useRouter();
  const [step, setStep] = useState(1);
  const [ticketId, setTicketId] = useState(''); const [targetId, setTargetId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false); const [retrying, setRetrying] = useState(false); const [error, setError] = useState('');
  if (!live || !tickets.length) return null;
  const ticket = tickets.find(item => item.id === ticketId);
  const options = !ticket ? [] : ticket.type === 'evolution' ? evolutionOptions(snapshot) : pokemon.filter(p => p.id !== 151 && legendaryEligible(p.id, snapshot));
  const selected = options.find(p => p.id === targetId);
  const activeStep = !ticket ? 1 : step === 3 && !selected ? 2 : step;
  async function activateTicket() {
    if (!ticket || !selected || busy) return;
    setBusy(true); setError(''); setRetrying(true);
    try { const receipt = await api<Receipt>('tickets/use', { ticketId: ticket.id, targetId: selected.id }); router.push(`/capture?receipt=${receipt.id}`); }
    catch (error) {
      setError(error instanceof Error ? error.message : '请重试。');
      if (error instanceof RequestError && error.status >= 400 && error.status < 500) setRetrying(false);
      setBusy(false);
    }
  }
  return <section className="detail-panel ticket-journey" id="use-ticket">
    <div className="section-heading"><h2><Sparkles size={23} /> 打开背包里的惊喜</h2></div>
    <ol className="journey-steps" aria-label="使用奖励券的步骤">{[{ Icon: Ticket, title: '选一张券' }, { Icon: Sparkles, title: '选伙伴' }, { Icon: Check, title: '出发' }].map(({ Icon, title }, index) => <li key={title} aria-current={activeStep === index + 1 ? 'step' : undefined} className={activeStep >= index + 1 ? 'reached' : ''}><span><Icon size={24} aria-hidden="true" /></span><b>{title}</b>{index < 2 && <ArrowRight size={19} aria-hidden="true" />}</li>)}</ol>
    <div className="journey-content" key={activeStep}>
    {activeStep === 1 && <><h3>点一张，看看里面的惊喜</h3><div className="picture-tickets" role="group" aria-label="选择奖励券">{tickets.map(item => <button type="button" key={item.id} aria-pressed={ticketId === item.id} className={`picture-ticket ${item.type} ${ticketId === item.id ? 'chosen' : ''}`} onClick={() => { setTicketId(item.id); setTargetId(null); setError(''); setRetrying(false); }}><span className="ticket-check">{ticketId === item.id ? <Check size={20} /> : <Ticket size={20} />}</span>{item.type === 'evolution' ? <Sparkles size={46} /> : <Mountain size={46} />}<strong>{item.type === 'evolution' ? '进化券' : '传说券'}</strong><span className="picture-ticket-reason">{item.reason || '一次值得记住的努力'}</span><small>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</small></button>)}</div><div className="journey-actions"><button className="button" disabled={!ticket} onClick={() => setStep(2)}>选好啦 <ArrowRight size={21} /></button></div></>}
    {activeStep === 2 && ticket && <><h3>{ticket.type === 'evolution' ? '想看看谁的新模样？' : '想和哪位神秘伙伴相遇？'}</h3>{options.length ? <><div className="picture-partners" role="group" aria-label="选择新伙伴">{options.map(target => <button className={`picture-partner ${selected?.id === target.id ? 'chosen' : ''}`} key={target.id} aria-pressed={selected?.id === target.id} onClick={() => setTargetId(target.id)}><span className="partner-check">{selected?.id === target.id ? <Check size={22} /> : <Sparkles size={20} />}</span><Transformation target={target} /><span className="partner-type-pictures">{target.types.map(type => <TypePicture type={type} key={type} />)}</span></button>)}</div>{ticket.type === 'evolution' && <p className="form-note">原来的伙伴会留下，新模样也会加入图鉴。</p>}</> : <div className="ticket-wait"><LockKeyhole size={38} /><h4>惊喜先留在背包里</h4><p>{ticket.type === 'evolution' ? '再认识一些伙伴，就有机会发现新的模样。' : '再收集一些伙伴，远方的传说就会开启。'}这张券没有被使用。</p></div>}<div className="journey-actions"><button className="button secondary" onClick={() => setStep(1)}><ArrowLeft size={19} /> 换张券</button>{options.length > 0 && <button className="button" disabled={!selected} onClick={() => setStep(3)}>就是它！ <ArrowRight size={21} /></button>}</div></>}
    {activeStep === 3 && ticket && selected && <div className="journey-confirm"><h3>{selected.evolvesFrom ? '一起迎接新模样！' : '新的相遇，准备好了！'}</h3><Transformation target={selected} /><div className={`confirmation-ticket ${ticket.type}`}><Ticket size={28} /><span>1 张{ticket.type === 'evolution' ? '进化券' : '传说券'}</span><ArrowRight size={23} /><Sparkles size={28} /><span>1 位新伙伴</span></div><p className="confirmation-reason">「{ticket.reason || '一次值得记住的努力'}」</p>{error && <p role="alert" className="form-error">{error}</p>}{retrying && !busy && <p className="form-note">可以重试同一次相遇，不会重复用券。刷新后也可以在首页找到已保存的结果。</p>}<div className="journey-actions">{!retrying && <button className="button secondary" onClick={() => setStep(2)}><ArrowLeft size={19} /> 再选选</button>}<button className="button" disabled={busy} onClick={() => void activateTicket()}><Sparkles size={23} />{busy ? '正在打开惊喜…' : retrying ? '重新打开这次相遇' : '出发！'}</button></div><p className="form-note">点击「出发」才会使用这张券。</p></div>}
    </div>
  </section>;
}
