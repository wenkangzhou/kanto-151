'use client';
import {localeTag} from '@/lib/i18n/locale';
import { useT } from '@/lib/i18n/locale';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Compass, Copy, KeyRound, Link2, LockKeyhole, Mountain, Smartphone, Sparkles } from 'lucide-react';
import { useCollection } from './collection-provider';
import { ParentLearning } from './parent-learning';
import { ParentPlayTime } from './parent-play-time';
import { ParentPreview } from './parent-preview';
import { useParentRewardDraft, useParentRewardHref } from './parent-reward-draft';
import { api } from '@/lib/api-client';
import { pokemonById } from '@/domain/pokemon';
import { PokemonArt } from './pokemon-art';
import type { ParentReward } from '@/domain/types';
const rewards = [
  { type: 'capture', Icon: Compass, title: '一次新相遇', subtitle: '当前区域里的一位新伙伴' },
  { type: 'evolution', Icon: Sparkles, title: '一次新成长', subtitle: '一张由孩子自主选择的进化券' },
  { type: 'legendary', Icon: Mountain, title: '一次特别的冒险', subtitle: '达到条件后使用的传说券' },
];
const rewardNames: Record<string, string> = { capture: '捕捉机会', evolution: '进化机会', legendary: '传说挑战' };
const reasons = ['独立完成', '坚持不放弃', '认真阅读', '开心运动', '帮助他人', '尝试困难的事'];
function PinUnlock() {
  const localize = useT();
  const { refresh } = useCollection();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const pin = new FormData(form).get('pin');
    setBusy(true); setError('');
    try { await api('parent/unlock', { pin }); form.reset(); await refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : '请重试。'); }
    finally { setBusy(false); }
  }
  return <div className="page"><section className="access-card"><span className="feature-icon"><KeyRound size={32} /></span><h1>{localize("这里留给家长")}</h1><p>{localize("输入六位家长 PIN，解锁 15 分钟。")}</p><form className="family-form" onSubmit={submit}><label>{localize("家长 PIN")}<input autoFocus type="password" name="pin" required inputMode="numeric" autoComplete="current-password" pattern="[0-9]{6}" maxLength={6} /></label>{error && <p role="alert" className="form-error">{localize(error)}</p>}<button className="button" disabled={busy}>{localize(busy ? '正在解锁…' : '打开家长空间')}</button></form><Link href="/setup" className="text-link">{localize("忘记 PIN？使用初始化口令恢复")}</Link><Link href="/" className="back-link">{localize("回到孩子的冒险")}</Link></section></div>;
}
function RewardForm({ initialType }: { initialType: ParentReward['type'] }) {
  const localize = useT();
  const [{ type, reason, result, busy, error, copied, request }, patch] = useParentRewardDraft(initialType);
  const setType = (type: string) => patch({ type });
  const setReason = (reason: string) => patch({ reason });
  const setResult = (result: ParentReward | null) => patch({ result });
  const setBusy = (busy: boolean) => patch({ busy });
  const setError = (error: string) => patch({ error });
  const setCopied = (copied: boolean) => patch({ copied });
  const setRequest = (request: { requestId: string; type: string; reason: string } | null) => patch({ request });
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    // Keep the same request and content on network retry until success or explicit reset.
    const payload = request ?? { requestId: crypto.randomUUID(), type, reason: reason.trim() };
    setRequest(payload);
    try { const reward = await api<ParentReward>('parent/rewards', payload); setResult(reward); setRequest(null); }
    catch (error) { setError(error instanceof Error ? error.message : '请重试。'); }
    finally { setBusy(false); }
  }
  if (result) return <section className="reward-result"><Sparkles size={32} /><h2>{localize("这份鼓励，准备好了")}</h2><span>{localize(rewardNames[result.type])}</span><output className="reward-code mono" aria-label={localize(`奖励码 ${result.code.split('').join(' ')}`)}>{localize(result.code)}</output><p>{result.reason || localize('一次值得记住的努力')}</p><p className="form-note">{localize("一次有效 ·")}{localize(new Date(result.expires_at).toLocaleDateString(localeTag()))}{localize("前兑换")}</p><div className="action-row"><button className="button" onClick={async () => { try { await navigator.clipboard.writeText(result.code); setCopied(true); } catch { setError('无法自动复制，可以长按奖励码复制。'); } }}><Copy size={17} />{localize(copied ? '已复制' : '复制奖励码')}</button><button className="button secondary" onClick={() => { setResult(null); setReason(''); setError(''); setCopied(false); }}>{localize("再准备一份奖励")}</button></div>{error && <p className="form-error" role="alert">{localize(error)}</p>}</section>;
  return <form onSubmit={submit} className="reward-form"><h2>{localize("这次想送出什么鼓励？")}</h2><fieldset className="reward-choices" disabled={busy || Boolean(request)}><legend className="sr-only">{localize("奖励类型")}</legend>{rewards.map(({ type: value, Icon, title, subtitle }) => <label className={type === value ? 'selected' : ''} key={value}><input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} /><Icon size={28} /><strong>{localize(title)}</strong><span>{localize(subtitle)}</span></label>)}</fieldset><label className="reason-label">{localize("写下这份奖励的理由")}<span>{localize("可选 · 留在成长手帐里")}</span><textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={160} rows={3} disabled={busy || Boolean(request)} placeholder={localize("例如：遇到难题没有放弃，又认真试了一次。")} /></label><div className="reason-tags">{reasons.map(tag => <button type="button" key={tag} disabled={busy || Boolean(request)} onClick={() => setReason(tag)}>{localize(tag)}</button>)}</div>{error && <p className="form-error" role="alert">{localize(error)}</p>}<div className="action-row"><button className="button" disabled={busy}>{localize(busy ? '正在准备…' : request ? '重试这份奖励' : '生成六位奖励码')}<ArrowRight size={17} /></button>{request && !busy && <Link href="/parent/history" className="text-link">{localize("先查看奖励记录")}</Link>}</div><p className="form-note">{localize(type === 'capture' ? '捕捉对象会在孩子兑换时选定，每次都遇见未收集的新伙伴。' : type === 'evolution' ? '兑换后进化券会留在背包里，由孩子选择伙伴的新模样。' : '兑换后传说券会留在背包里，达到条件后由孩子选择传说伙伴。')}</p></form>;
}
function RewardHistory() {
  const localize = useT();
  const [items, setItems] = useState<ParentReward[]>([]); const [page, setPage] = useState(0); const [more, setMore] = useState(false); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async (page: number) => {
    setBusy(true); setError('');
    try { const data = await api<{ rewards: ParentReward[]; hasMore: boolean }>(`parent/rewards?page=${page}`); setItems(previous => page === 0 ? data.rewards : [...new Map([...previous, ...data.rewards].map(item => [item.id, item])).values()]); setPage(page); setMore(data.hasMore); }
    catch (error) { setError(error instanceof Error ? error.message : '请重试。'); }
    finally { setBusy(false); }
  }, []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const controller = new AbortController();
    api<{ rewards: ParentReward[]; hasMore: boolean }>('parent/rewards?page=0', undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) { setItems(data.rewards); setMore(data.hasMore); } })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '请重试。'); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);
  async function revoke(id: string) {
    setBusy(true); setError('');
    try { await api('parent/rewards/revoke', { id }); await load(0); }
    catch (error) { setError(error instanceof Error ? error.message : '撤销失败。'); setBusy(false); }
  }
  return <section><div className="section-heading"><h2>{localize("送出的每一份鼓励")}</h2><button className="text-link" disabled={busy} onClick={() => void load(0)}>{localize("刷新记录")}</button></div>{error && <p className="form-error" role="alert">{localize(error)}</p>}<div className="reward-history">{items.map(item => {
    const expired = new Date(item.expires_at).getTime() <= now;
    const status = item.redeemed_at ? item.outcome?.state === 'used' ? '已使用' : item.outcome?.state === 'stored' ? '已领取 · 待使用' : item.type === 'capture' ? '已相遇' : '已领取' : item.revoked_at ? '已撤销' : expired ? '已过期' : '等待兑换';
    return <article key={item.id}><div><span className="mono">{localize(item.code)}</span><span className="reward-status">{localize(status)}</span></div><h3>{localize(rewardNames[item.type])}</h3><RewardOutcome reward={item} /><p>{item.reason || localize('一次值得记住的努力')}</p><small>{localize(new Date(item.created_at).toLocaleString(localeTag()))}</small>{!item.redeemed_at && !item.revoked_at && !expired && <button className="text-link" disabled={busy} onClick={() => void revoke(item.id)}>{localize("撤销这份奖励")}</button>}</article>;
  })}</div>{!items.length && !busy && <div className="empty-state compact"><h3>{localize("第一份鼓励，等你送出")}</h3><Link href="/parent/reward" className="text-link">{localize("生成奖励码")}<ArrowRight size={16} /></Link></div>}{busy && <p className="form-note" role="status">{localize("正在读取…")}</p>}{more && <button className="button secondary" disabled={busy} onClick={() => void load(page + 1)}>{localize("查看更多记录")}</button>}</section>;
}
function RewardOutcome({ reward }: { reward: ParentReward }) {
  const localize = useT();
  const outcome=reward.outcome;
  if(!outcome)return null;
  const partner=outcome.pokemonId?pokemonById.get(outcome.pokemonId):null;
  const previous=outcome.fromPokemonId?pokemonById.get(outcome.fromPokemonId):null;
  return <div className="parent-reward-outcome">
    {partner?<Link href={`/pokemon/${partner.id}?from=parent`} className="parent-reward-partner">
      {previous&&<><PokemonArt pokemon={previous}/><ArrowRight size={18} aria-hidden="true"/></>}
      <PokemonArt pokemon={partner}/><strong>{localize(previous?`${previous.name} → ${partner.name}`:`遇见了${partner.name}`)}</strong>
    </Link>:<span>{localize(outcome.state==='stored'?'券已放入孩子的背包，尚未使用':outcome.state==='used'?'券已使用，暂无伙伴详情':'已领取，暂无伙伴详情')}</span>}
    {outcome.usedAt&&<small>{localize("使用于")}{localize(new Date(outcome.usedAt).toLocaleString(localeTag()))}</small>}
  </div>;
}
function FamilyDevices() {
  const localize = useT();
  const { refresh } = useCollection();
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]); const [currentId, setCurrentId] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { const result = await api<{ devices: { id: string; name: string }[]; currentId: string }>('parent/devices'); setDevices(result.devices); setCurrentId(result.currentId); } catch (error) { setError(error instanceof Error ? error.message : '请重试。'); } }, []);
  useEffect(() => {
    const controller = new AbortController();
    api<{ devices: { id: string; name: string }[]; currentId: string }>('parent/devices', undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setDevices(result.devices); setCurrentId(result.currentId); } })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '请重试。'); });
    return () => controller.abort();
  }, []);
  async function action(path: string, body: Record<string, unknown> = {}) {
    setBusy(true); setError('');
    try { if (path === 'parent/pairing') setPairing(await api(path, body)); else { await api(path, body); if (path === 'disconnect') await refresh(); else await load(); } }
    catch (error) { setError(error instanceof Error ? error.message : '请重试。'); }
    finally { setBusy(false); }
  }
  return <section className="detail-panel"><div className="section-heading"><h2><Smartphone size={20} />{localize("家庭设备")}</h2><button className="text-link" disabled={busy} onClick={() => void load()}>{localize("刷新")}</button></div><p className="strength-summary">{localize("在孩子的设备上打开本站的「连接设备」，输入下面生成的连接码。")}</p><button className="button secondary" disabled={busy} onClick={() => void action('parent/pairing')}><Link2 size={17} />{localize("生成设备连接码")}</button>{pairing && <div className="pairing-code"><output className="mono">{localize(pairing.code.match(/.{4}/g)?.join('-'))}</output><p>{localize("一次有效 ·")}{localize(new Date(pairing.expiresAt).toLocaleTimeString(localeTag()))}{localize("到期")}</p></div>}<div className="device-list">{devices.map(device => <div key={device.id}><Smartphone size={18} /><span>{device.name}</span>{device.id === currentId ? <button className="text-link" disabled={busy} onClick={() => void action('disconnect')}>{localize("当前设备 · 退出连接")}</button> : <button className="text-link" disabled={busy} onClick={() => void action('parent/devices/revoke', { id: device.id })}>{localize("解除连接")}</button>}</div>)}</div>{error && <p role="alert" className="form-error">{localize(error)}</p>}</section>;
}
export function ParentArea({ view = 'dashboard', initialRewardType = 'capture' }: { view?: 'dashboard' | 'reward' | 'history'; initialRewardType?: ParentReward['type'] }) {
  const localize = useT();
  const rewardHref = useParentRewardHref();
  const { live, parent, refresh, snapshot, childName, familyName } = useCollection(); const router = useRouter(); const [error, setError] = useState('');
  if (!live) return <ParentPreview />;
  if (!parent) return <PinUnlock />;
  return <div className="page parent-page"><div className="page-heading"><div><div className="eyebrow"><span /> {familyName}</div><h1>{localize("看见成长，送出鼓励")}<span className="title-dot">.</span></h1><p>{localize("{0}已与{1}位伙伴相遇。",[childName,snapshot.records.length])}</p></div><button className="button secondary" onClick={async () => { try { await api('parent/lock', {}); await refresh(); router.replace('/'); } catch { setError('未能锁定，请重试。'); } }}><LockKeyhole size={16} />{localize("锁定")}</button></div><nav className="parent-tabs" aria-label={localize("家长导航")}><Link href="/parent/dashboard" className={view === 'dashboard' ? 'selected' : ''}>{localize("家庭概览")}</Link><Link href={rewardHref} className={view === 'reward' ? 'selected' : ''}>{localize("生成奖励")}</Link><Link href="/parent/history" className={view === 'history' ? 'selected' : ''}>{localize("奖励记录")}</Link></nav>{error && <p className="form-error" role="alert">{localize(error)}</p>}{view === 'reward' ? <RewardForm key={initialRewardType} initialType={initialRewardType} /> : view === 'history' ? <RewardHistory /> : <><ParentPlayTime /><ParentLearning /><div className="parent-rewards">{rewards.map(({ type, Icon, title, subtitle }) => <Link className="parent-action-card" key={type} href={`/parent/reward?type=${type}`}><Icon size={30} /><h2>{localize(title)}</h2><p>{localize(subtitle)}</p><span className="text-link">{localize("准备一份奖励")}<ArrowRight size={16} /></span></Link>)}</div><FamilyDevices /><Link href="/history" className="text-link">{localize("看看孩子的成长足迹")}<ArrowRight size={17} /></Link></>}</div>;
}
