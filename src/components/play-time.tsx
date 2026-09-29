'use client';
import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Clock3, Moon, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api-client';
import { speakText, stopVoice } from '@/lib/voice-audio';
import { remainingSeconds, timeLabel, type PlayTime } from '@/domain/play-time';
import { useCollection } from './collection-provider';
import { PokemonArt } from './pokemon-art';
import { pokemonById } from '@/domain/pokemon';

const warning = '快到休息时间啦，我们准备休息吧。';
type View = { data: PlayTime | null; seconds: number; expired: boolean; locked: boolean; notice: boolean; error: string };
type Clock = { data: PlayTime; mono: number; wall: number; server: number; elapsed: number };
type ContextValue = View & { refresh: () => Promise<void>; accept: (data: PlayTime) => void; activity: (key: string | null) => void };
const initial: View = { data: null, seconds: 0, expired: false, locked: true, notice: false, error: '' };
const Context = createContext<ContextValue>({ ...initial, async refresh() {}, accept() {}, activity() {} });
export const usePlayTime = () => useContext(Context);
export function PlayTimeProvider({ children }: { children: ReactNode }) {
  const { live, status } = useCollection();
  const pathname = usePathname();
  const active = live && status === 'ready';
  const [view, setView] = useState<View>(initial);
  const clock = useRef<Clock | null>(null);
  const busy = useRef<string | null>(null);
  const grace = useRef<{ deadline: string | null; key: string | null; until: number } | null>(null);
  const version = useRef(0);
  const reminderUntil = useRef(0);
  const warned = useRef(new Set<string>());
  const sample = useCallback(() => {
    const c = clock.current;
    if (!c) return;
    // Monotonic time prevents rolling back the device clock; wall time covers iOS sleep.
    c.elapsed = Math.max(c.elapsed, performance.now() - c.mono, Date.now() - c.wall);
    const now = c.server + c.elapsed;
    const seconds = remainingSeconds(c.data, now);
    const expired = c.data.enabled && seconds === 0;
    if (!expired) grace.current = null;
    else if (!grace.current || grace.current.deadline !== c.data.expiresAt) {
      // Manual locks have no grace. Natural expiry only finishes the current animation.
      grace.current = { deadline: c.data.expiresAt, key: c.data.expiresAt ? busy.current : null, until: now + 10_000 };
    }
    const finishing = expired && grace.current?.key && grace.current.key === busy.current && now < grace.current.until;
    const locked = !!(expired && !finishing);
    const notice = reminderUntil.current > performance.now() && !expired;
    setView(previous => previous.data === c.data && previous.seconds === seconds && previous.expired === expired && previous.locked === locked && previous.notice === notice ? previous : { ...previous, data: c.data, seconds, expired, locked, notice });
  }, []);
  const accept = useCallback((data: PlayTime, started = performance.now()) => {
    ++version.current;
    const previous = clock.current;
    // A slow read must never overwrite a newer control action.
    if (previous && data.revision < previous.data.revision) return;
    clock.current = { data, mono: performance.now(), wall: Date.now(), server: Date.parse(data.serverNow) + Math.max(0, performance.now() - started), elapsed: 0 };
    setView(previous => ({ ...previous, error: '' }));
    sample();
  }, [sample]);
  const refresh = useCallback(async () => {
    if (!active) return;
    const request = ++version.current;
    const started = performance.now();
    try {
      const data = await api<PlayTime>('play-time', undefined, AbortSignal.timeout(10_000));
      if (request === version.current) accept(data, started);
    } catch (error) {
      if (request === version.current) setView(previous => ({ ...previous, error: error instanceof Error ? error.message : '暂时无法核对使用时间。' }));
    }
  }, [active, accept]);
  const invalidate = useCallback(() => { ++version.current; }, []);
  const activity = useCallback((key: string | null) => { busy.current = key; sample(); }, [sample]);
  useEffect(() => {
    if (!active) return;
    void refresh();
    const tick = setInterval(sample, 500);
    const poll = setInterval(() => { if (!document.hidden) void refresh(); }, 15_000);
    const resume = () => { sample(); if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume); window.addEventListener('online', resume); window.addEventListener('kanto-play-time-refresh', resume);
    return () => { invalidate(); clearInterval(tick); clearInterval(poll); document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume); window.removeEventListener('online', resume); window.removeEventListener('kanto-play-time-refresh', resume); };
  }, [active, refresh, sample, invalidate]);
  const parentPage = pathname.startsWith('/parent') || pathname === '/setup';
  useEffect(() => {
    if (active && view.locked && !parentPage) stopVoice();
  }, [active, view.locked, parentPage]);
  useEffect(() => {
    const deadline = view.data?.expiresAt;
    if (!active || parentPage || !deadline || !view.data?.enabled || view.seconds <= 0 || view.seconds > 120 || warned.current.has(deadline)) return;
    warned.current.add(deadline);
    const key = `kanto-time-warning:${deadline}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* Reminder is optional if storage is unavailable. */ }
    reminderUntil.current = performance.now() + 6000;
    speakText('play-time-warning', warning, { loadTimeoutMs: 2500 });
  }, [active, parentPage, view.data, view.seconds]);
  return <Context.Provider value={{ ...view, locked: active && view.locked, expired: active && view.expired, refresh, accept, activity }}>{children}</Context.Provider>;
}
export function usePlayTimeAnimation(key: string | null) {
  const { activity } = usePlayTime();
  useEffect(() => { activity(key); return () => activity(null); }, [activity, key]);
}
export function PlayTimeBadge() {
  const { data, seconds, expired } = usePlayTime();
  if (!data?.enabled) return null;
  return <span className={`play-time-badge ${seconds <= 120 ? 'ending' : ''}`} aria-label={expired ? '休息时间' : `剩余 ${Math.ceil(seconds / 60)} 分钟`}><Clock3 size={17} aria-hidden="true" />{expired ? '休息时间' : timeLabel(seconds)}</span>;
}
export function PlayTimeNotice() {
  const { notice } = usePlayTime();
  return notice ? <div className="play-time-notice" role="status">快到休息时间啦，我们准备休息吧</div> : null;
}
export function PlayTimeRest() {
  const { data, error, refresh } = usePlayTime();
  return <section className="play-time-rest" aria-labelledby="rest-title"><div className="rest-partner"><PokemonArt pokemon={pokemonById.get(143)!} /><Moon aria-hidden="true" /></div><h1 id="rest-title">{data ? '伙伴们要休息啦' : '正在核对使用时间'}</h1><p>{data ? '休息一下，明天可以继续，也可以请家长重新开启。' : '连接家庭手帐后继续冒险。'}</p>{error && <><p className="form-error" role="alert">{error}</p><button className="button secondary" onClick={() => void refresh()}>重新连接</button></>}<Link href="/parent" className="text-link"><ShieldCheck size={17} />家长开启</Link></section>;
}
