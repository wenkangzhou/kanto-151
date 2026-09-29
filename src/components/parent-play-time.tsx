'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, Play, LockKeyhole } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useCollection } from './collection-provider';
import { usePlayTime } from './play-time';
import { timeLabel, validMinutes, type PlayTime, type PlayTimeAction } from '@/domain/play-time';
export function ParentPlayTime() {
  const { data, error, refresh } = usePlayTime();
  if (!data) return <section className="detail-panel"><h2>使用时间</h2><p>{error || '正在读取…'}</p><button className="button secondary" onClick={() => void refresh()}>重新读取</button></section>;
  return <TimeControls key={data.minutes} data={data} />;
}
function TimeControls({ data }: { data: PlayTime }) {
  const { seconds, accept, refresh: refreshTime } = usePlayTime();
  const { refresh } = useCollection();
  const router = useRouter();
  const [minutes, setMinutes] = useState(data.minutes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{ action: PlayTimeAction; minutes: number; expected: number; requestId: string } | null>(null);
  async function control(action: PlayTimeAction) {
    if (busy || !validMinutes(minutes)) return;
    const payload = pending ?? { action, minutes, expected: data.revision, requestId: crypto.randomUUID() };
    setPending(payload); setBusy(true); setError(''); setNotice('');
    try {
      const next = await api<PlayTime>('parent/play-time', payload);
      setPending(null); accept(next);
      setNotice(payload.action === 'start' ? '新一轮时间已开启' : payload.action === 'configure' ? '已保存，下次开启生效' : payload.action === 'disable' ? '已关闭时间控制' : '已通知孩子休息');
    } catch (error) { setError(error instanceof Error ? error.message : '操作未完成，请重试。'); }
    finally { setBusy(false); }
  }
  async function returnToChild() {
    setBusy(true); setError('');
    try { await api('parent/lock', {}); await refresh(); router.replace('/'); }
    catch { setError('未能退出家长空间，请重试。'); setBusy(false); }
  }
  return <section className="detail-panel parent-play-time" aria-labelledby="play-time-heading"><div className="section-heading"><h2 id="play-time-heading"><Clock3 size={22} />使用时间</h2><strong className="play-time-state">{!data.enabled ? '未开启' : seconds > 0 ? `剩余 ${timeLabel(seconds)}` : '休息中'}</strong></div>
    <div className="play-time-settings"><label htmlFor="round-minutes">每日时长</label><div className="time-presets">{[10,20,30].map(value => <button type="button" key={value} aria-pressed={minutes === value} disabled={busy || !!pending} onClick={() => setMinutes(value)}>{value} 分钟</button>)}<label className="custom-minutes"><span className="sr-only">自定义分钟数</span><input id="round-minutes" type="number" min={1} max={120} step={1} value={Number.isNaN(minutes) ? '' : minutes} disabled={busy || !!pending} onChange={event => setMinutes(event.target.valueAsNumber)} />分钟</label></div></div>
    <p className="form-note">按北京时间每日重置，首次打开应用开始计时。离开应用也继续计时，家庭设备共享。家长可当天重新开启，远程操作通常在 15 秒内同步。</p>
    <div className="action-row"><button className="button" disabled={busy || !!pending || !validMinutes(minutes)} onClick={() => void control('start')}><Play size={17} />{data.enabled ? '重新开启一轮' : '开启时间控制并开始'}</button>{minutes !== data.minutes && <button className="button secondary" disabled={busy || !!pending || !validMinutes(minutes)} onClick={() => void control('configure')}>保存时长，下次开启生效</button>}{data.enabled && <><button className="button secondary" disabled={busy || !!pending} onClick={() => void control('lock')}><LockKeyhole size={17} />立即休息</button><button className="button secondary" disabled={busy || !!pending} onClick={() => void control('disable')}>关闭时间控制</button></>}</div>
    {error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status" className="form-note">{notice}</p>}{pending && !busy && <div className="action-row"><button className="button secondary" onClick={() => void control(pending.action)}>重试这次操作</button><button className="text-link" onClick={async () => { await refreshTime(); setPending(null); setError(''); }}>重新读取状态</button></div>}
    {(!data.enabled || seconds > 0) && <button className="text-link" disabled={busy || !!pending} onClick={() => void returnToChild()}>锁定家长空间，交还孩子</button>}
  </section>;
}
