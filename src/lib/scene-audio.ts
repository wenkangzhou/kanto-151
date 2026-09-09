export const sceneTracks = {
  capture: '/audio/effects/capture.mp3',
  evolution: '/audio/effects/evolution.mp3',
  'capture-success': '/audio/effects/capture-success.mp3',
  'evolution-success': '/audio/effects/evolution-success.mp3',
  gift: '/audio/effects/gift.mp3',
} as const;
export type SceneSound = keyof typeof sceneTracks;
export const sceneAudioEvent = 'kanto-scene-audio';
export type SceneAudioRequest = { owner: string; sound?: SceneSound };
export function playSceneSound(owner: string, sound: SceneSound) {
  window.dispatchEvent(new CustomEvent<SceneAudioRequest>(sceneAudioEvent, { detail: { owner, sound } }));
}
export function stopSceneSound(owner: string) {
  window.dispatchEvent(new CustomEvent<SceneAudioRequest>(sceneAudioEvent, { detail: { owner } }));
}
interface CueAudio {
  volume: number;
  play(): Promise<void>; pause(): void; load(): void; removeAttribute(name: string): void;
  addEventListener(name: string, listener: () => void): void;
  removeEventListener(name: string, listener: () => void): void;
}
export function createCuePlayer(createAudio: (source: string) => CueAudio, suspend: () => () => void) {
  let active: { owner: string; release: (resume: boolean) => void } | undefined;
  const stop = (resume = true, owner?: string) => {
    if (active && (!owner || active.owner === owner)) { const old = active; active = undefined; old.release(resume); }
  };
  return {
    play(owner: string, sound: SceneSound) {
      stop(false);
      const resume = suspend();
      let audio: CueAudio;
      try { audio = createAudio(sceneTracks[sound]); } catch { resume(); return; }
      const done = () => { if (active?.release === release) stop(); };
      const timer = setTimeout(done, 20_000);
      const release = (restore: boolean) => {
        clearTimeout(timer); audio.removeEventListener('ended', done); audio.removeEventListener('error', done);
        audio.pause(); audio.removeAttribute('src'); audio.load(); if (restore) resume();
      };
      active = { owner, release }; audio.volume = 0.25;
      audio.addEventListener('ended', done); audio.addEventListener('error', done);
      // Called synchronously from the child's tap, including on iPad Safari.
      try { void audio.play().catch(done); } catch { done(); }
    },
    stop,
  };
}
