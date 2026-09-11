'use client';
import { useEffect, useId, useSyncExternalStore } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speakText, stopVoice, subscribeVoice, voiceSnapshot, voiceServerSnapshot } from '@/lib/voice-audio';
export function ReadAloud({ text, label = '听听这段说明' }: { text: string; label?: string }) {
  const owner = useId();
  const state = useSyncExternalStore(subscribeVoice, voiceSnapshot, voiceServerSnapshot);
  const playing = state.owner === owner;
  useEffect(() => () => stopVoice(owner), [owner, text]);
  return <span className="read-aloud"><button type="button" className="read-aloud-button" aria-label={playing ? '停止朗读' : label} title={playing ? '停止朗读' : label} aria-pressed={playing} onClick={() => speakText(owner, text)}>{playing ? <Square size={15} fill="currentColor" /> : <Volume2 size={19} />}</button></span>;
}
