'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { stopVoice, subscribeVoice, voiceSnapshot, voiceServerSnapshot } from '@/lib/voice-audio';
export function VoiceLifecycle() {
  const pathname = usePathname();
  const state = useSyncExternalStore(subscribeVoice, voiceSnapshot, voiceServerSnapshot);
  useEffect(() => {
    const hidden = () => { if (document.hidden) stopVoice(); };
    const stop = () => stopVoice();
    document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', stop);
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', stop); stopVoice(); };
  }, [pathname]);
  return state.error ? <div className="voice-error" role="status">{state.error}</div> : null;
}
