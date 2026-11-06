'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

let registration: Promise<ServiceWorkerRegistration> | null = null;

export function ServiceWorkerRegistration() {
  const pathname = usePathname();
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    let active = true;
    registration ??= navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).catch(error => {
      registration = null;
      throw error;
    });
    const warmCurrentPage = () => { void registration?.then(worker => {
      if (active && navigator.onLine && /^\/(?:johto|hoenn)\/pokedex(?:\/[1-9]\d{0,2})?$/.test(pathname)) {
        worker.active?.postMessage({ type: 'warm-regional-page', path: pathname });
      }
    }).catch(() => {}); };
    warmCurrentPage();
    navigator.serviceWorker.addEventListener('controllerchange', warmCurrentPage);
    return () => { active = false; navigator.serviceWorker.removeEventListener('controllerchange', warmCurrentPage); };
  }, [pathname]);
  return null;
}
