'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LoaderCircle, Volume2, VolumeX } from 'lucide-react';
import { backgroundTrack, createMusicPlayer, supportsBackgroundMusic, type MusicState } from '@/lib/background-music';

const subscribe = (callback: () => void) => {
  window.addEventListener('resize', callback); window.addEventListener('orientationchange', callback);
  return () => { window.removeEventListener('resize', callback); window.removeEventListener('orientationchange', callback); };
};
const isLargeDevice = () => supportsBackgroundMusic({ width: window.innerWidth, screenWidth: screen.width, screenHeight: screen.height, coarse: window.matchMedia('(pointer: coarse)').matches, userAgent: navigator.userAgent });
function MusicControl({ available }: { available: boolean }) {
  const [state, setState] = useState<MusicState>('off');
  const player = useRef<ReturnType<typeof createMusicPlayer> | null>(null);
  useEffect(() => {
    const visibility = () => { if (document.hidden) player.current?.stop(); };
    const stop = () => player.current?.stop();
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', stop);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', stop); player.current?.dispose(); player.current = null; };
  }, []);
  const on = state === 'playing' || state === 'loading';
  const label = !available ? '尚未添加背景音乐文件' : state === 'error' ? '播放失败，点击重试' : state === 'loading' ? '正在加载音乐，点击取消' : on ? '关闭背景音乐' : '开启背景音乐';
  return <div className="background-music"><button type="button" className={`music-switch ${on ? 'music-on' : ''}`} disabled={!available} aria-label={label} aria-pressed={on} title={label} onClick={() => {
    player.current ??= createMusicPlayer(() => { const audio = new Audio(); audio.preload = 'none'; audio.src = backgroundTrack.source; return audio; }, setState);
    void player.current.toggle();
  }}>{state === 'playing' ? <Volume2 size={20} aria-hidden="true" /> : state === 'loading' ? <LoaderCircle size={20} className="music-loading" aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}</button><span className="sr-only" role="status">{state === 'error' ? '音乐暂时无法播放，请点击音乐开关重试' : ''}</span></div>;
}
export function BackgroundMusic({ available }: { available: boolean }) {
  const large = useSyncExternalStore(subscribe, isLargeDevice, () => false);
  return large ? <MusicControl available={available} /> : null;
}
