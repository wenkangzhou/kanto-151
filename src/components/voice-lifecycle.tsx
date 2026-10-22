'use client';
import { useT } from '@/lib/i18n/locale';

import { useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { stopVoice, subscribeVoice, voiceSnapshot, voiceServerSnapshot } from '@/lib/voice-audio';
export function VoiceLifecycle() {
  const localize = useT();
  const pathname = usePathname();
  const state = useSyncExternalStore(subscribeVoice, voiceSnapshot, voiceServerSnapshot);
  useEffect(() => {
    const hidden = () => { if (document.hidden) stopVoice(); };
    const stop = () => stopVoice();
    document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', stop);
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', stop); stopVoice(); };
  }, [pathname]);
  return state.error ? <div className="voice-error" role="status">{localize(state.error)}</div> : null;
}
