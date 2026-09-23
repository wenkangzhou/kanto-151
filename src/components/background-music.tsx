'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LoaderCircle, Volume2, VolumeX } from 'lucide-react';
import { backgroundTrack, createMusicPlayer, supportsBackgroundMusic, type MusicState } from '@/lib/background-music';

import { battleAudioEvent, createBattleAudio, type BattleAudioRequest } from '@/lib/battle-audio';
import { voiceFocusEvent, voiceSnapshot, stopVoice } from '@/lib/voice-audio';
import { createCuePlayer, sceneAudioEvent, type SceneAudioRequest } from '@/lib/scene-audio';

const subscribe = (callback: () => void) => {
  window.addEventListener('resize', callback); window.addEventListener('orientationchange', callback);
  return () => { window.removeEventListener('resize', callback); window.removeEventListener('orientationchange', callback); };
};
const isLargeDevice = () => supportsBackgroundMusic({ width: window.innerWidth, screenWidth: screen.width, screenHeight: screen.height, coarse: window.matchMedia('(pointer: coarse)').matches, userAgent: navigator.userAgent });
function MusicControl({ available }: { available: boolean }) {
  const [soundEnabled,setSoundEnabled]=useState(false);
  const [state, setState] = useState<MusicState>('off');
  const player = useRef<ReturnType<typeof createMusicPlayer> | null>(null);
  const currentState = useRef<MusicState>('off');
  const cue = useRef<ReturnType<typeof createCuePlayer> | null>(null);
  const battle = useRef<ReturnType<typeof createBattleAudio> | null>(null);
  useEffect(() => {
    battle.current = createBattleAudio(source => { const audio = new Audio(source); audio.preload = 'none'; return audio; }, () => player.current?.suspendForCue() ?? (() => {}));
    const battleEvent = (event: Event) => {
      const request = (event as CustomEvent<BattleAudioRequest>).detail;
      if (request.action === 'enter') cue.current?.stop(true);
      battle.current?.request(request);
    };
    window.addEventListener(battleAudioEvent, battleEvent);
    cue.current = createCuePlayer(source => { const audio = new Audio(source); audio.preload = 'none'; return audio; }, () => player.current?.suspendForCue() ?? (() => {}));
    let resumeVoice: (() => void) | undefined;
    const voiceFocus = (event: Event) => {
      const active = (event as CustomEvent<boolean>).detail;
      battle.current?.voice(active);
      if (battle.current?.active) return;
      if ((event as CustomEvent<boolean>).detail) { cue.current?.stop(false); resumeVoice = player.current?.suspendForCue(); }
      else { const resume = resumeVoice; resumeVoice = undefined; resume?.(); }
    };
    window.addEventListener(voiceFocusEvent, voiceFocus);
    const scene = (event: Event) => {
      const { owner, sound } = (event as CustomEvent<SceneAudioRequest>).detail;
      if (!sound) cue.current?.stop(true, owner);
      else if (currentState.current === 'playing' && !document.hidden && !voiceSnapshot().owner) cue.current?.play(owner, sound);
    };
    window.addEventListener(sceneAudioEvent, scene);
    const visibility = () => { if (document.hidden) { cue.current?.stop(false); player.current?.stop(); battle.current?.setEnabled(false);setSoundEnabled(false); } };
    const stop = () => { cue.current?.stop(false); player.current?.stop();battle.current?.setEnabled(false);setSoundEnabled(false); };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', stop);
    return () => { window.removeEventListener(battleAudioEvent, battleEvent); battle.current?.dispose(); battle.current = null; window.removeEventListener(voiceFocusEvent, voiceFocus); window.removeEventListener(sceneAudioEvent, scene); cue.current?.stop(false); cue.current = null; document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', stop); player.current?.dispose(); player.current = null; };
  }, []);
  const on = soundEnabled;
  const label = !available ? '尚未添加背景音乐文件' : on ? '关闭声音' : '开启声音';
  return <div className="background-music"><button type="button" className={`music-switch ${on ? 'music-on' : ''}`} disabled={!available} aria-label={label} aria-pressed={on} title={label} onClick={() => {
    stopVoice();
    player.current ??= createMusicPlayer(() => { const audio = new Audio(); audio.preload = 'none'; audio.src = backgroundTrack.source; return audio; }, next => { currentState.current = next; setState(next);  if (next === 'error' || next === 'off') cue.current?.stop(false); });
    cue.current?.stop(false);
    setSoundEnabled(!on);
    if(on){battle.current?.setEnabled(false);player.current.stop();}
    else {void player.current.toggle();battle.current?.setEnabled(true);}
  }}>{on ? <Volume2 size={20} aria-hidden="true" /> : state === 'loading' ? <LoaderCircle size={20} className="music-loading" aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}</button><span className="sr-only" role="status">{state === 'error' ? '背景音乐暂时不可用，短音效仍可播放' : ''}</span></div>;
}
export function BackgroundMusic({ available }: { available: boolean }) {
  const large = useSyncExternalStore(subscribe, isLargeDevice, () => false);
  return large ? <MusicControl available={available} /> : null;
}
