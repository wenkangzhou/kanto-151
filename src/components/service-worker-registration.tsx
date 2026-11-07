'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/i18n/locale';
import styles from './service-worker-registration.module.css';

type Status = 'idle' | 'checking' | 'saved' | 'missing' | 'unavailable';
let registration: Promise<ServiceWorkerRegistration> | null = null;
const regionalPath = (path: string) => /^\/(?:johto|hoenn)\/pokedex(?:\/[1-9]\d{0,2})?$/.test(path);

function pageStatus(worker: ServiceWorkerRegistration, path: string, warm: boolean): Promise<Status> {
  return new Promise(resolve => {
    if (!worker.active) { resolve('unavailable'); return; }
    const channel = new MessageChannel();
    let settled = false;
    const finish = (result: Status) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      channel.port1.close();
      resolve(result);
    };
    const timeout = window.setTimeout(() => finish('unavailable'), 5_000);
    channel.port1.onmessage = event => {
      finish(event.data?.saved === true ? 'saved' : 'missing');
    };
    try { worker.active.postMessage({ type: 'regional-page-status', path, warm }, [channel.port2]); }
    catch { finish('unavailable'); }
  });
}

export function ServiceWorkerRegistration() {
  const pathname = usePathname();
  const english = useLocale() === 'en';
  const [status, setStatus] = useState<Status>('idle');
  const [online, setOnline] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
      if (process.env.NODE_ENV === 'production' && regionalPath(pathname)) {
        const timer = window.setTimeout(() => setStatus('unavailable'), 0);
        return () => window.clearTimeout(timer);
      }
      return;
    }
    let active = true;
    let request = 0;
    registration ??= navigator.serviceWorker.getRegistration('/').then(existing => {
      if (existing) {
        if (navigator.onLine) void existing.update().catch(() => {});
        return existing;
      }
      return navigator.serviceWorker.register('/sw.js');
    }).then(() => navigator.serviceWorker.ready).catch(error => {
      registration = null;
      throw error;
    });
    const check = () => {
      if (!regionalPath(pathname)) { setStatus('idle'); return; }
      const current = ++request;
      setStatus('checking');
      const timeout = window.setTimeout(() => { if (active && current === request) setStatus('unavailable'); }, 8_000);
      void registration?.then(worker => pageStatus(worker, pathname, navigator.onLine))
        .then(result => { if (active && current === request) setStatus(result); })
        .catch(() => { if (active && current === request) setStatus('unavailable'); })
        .finally(() => window.clearTimeout(timeout));
    };
    check();
    navigator.serviceWorker.addEventListener('controllerchange', check);
    return () => { active = false; navigator.serviceWorker.removeEventListener('controllerchange', check); };
  }, [pathname, online, retry]);

  if (!regionalPath(pathname) || status === 'idle' || process.env.NODE_ENV !== 'production') return null;
  const message = status === 'checking'
    ? english ? 'Checking offline copy…' : '正在确认离线保存…'
    : status === 'saved'
      ? online ? english ? 'Saved for offline reading' : '本页已保存 · 可离线重开' : english ? 'Reading saved page offline' : '离线阅读中 · 本页已保存'
      : status === 'missing'
        ? online ? english ? 'Offline save did not finish' : '离线保存尚未完成' : english ? 'Not saved · reconnect before leaving' : '本页未保存 · 离开后需联网'
        : english ? 'Could not confirm offline copy' : '暂时无法确认离线保存';
  return <div className={`${styles.notice} ${status === 'saved' ? styles.saved : status === 'checking' ? styles.checking : styles.warning}`} role="status" aria-live="polite">
    <span className={styles.dot} aria-hidden="true" /><span>{message}</span>
    {online && (status === 'missing' || status === 'unavailable') && <button type="button" onClick={() => setRetry(value => value + 1)}>{english ? 'Retry' : '重试'}</button>}
  </div>;
}
