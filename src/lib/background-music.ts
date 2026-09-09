export const backgroundTrack = {
  title: '六之岛・七之岛',
  source: '/audio/sevii-islands-6-7.mp3',
} as const;

export function supportsBackgroundMusic({ width, screenWidth, screenHeight, coarse, userAgent }: {
  width: number; screenWidth: number; screenHeight: number; coarse: boolean; userAgent: string;
}) {
  // Screen size also excludes phones rotated to landscape. iPadOS may use a desktop UA.
  const phone = /iPhone|iPod|Android.*Mobile/i.test(userAgent);
  return width >= 768 && !phone && !(coarse && Math.min(screenWidth, screenHeight) < 600);
}

export type MusicState = 'off' | 'loading' | 'playing' | 'error';
export interface MusicAudio {
  loop: boolean; volume: number;
  play(): Promise<void>; pause(): void; load(): void; removeAttribute(name: string): void;
  addEventListener(name: string, listener: () => void): void;
  removeEventListener(name: string, listener: () => void): void;
}
// One player for the root layout. Creating the audio and loading its source require a click.
export function createMusicPlayer(createAudio: () => MusicAudio, notify: (state: MusicState) => void) {
  let audio: MusicAudio | null = null;
  let wanted = false; let disposed = false; let revision = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { clearTimeout(timeout); timeout = undefined; };
  const emit = (state: MusicState) => { if (!disposed) notify(state); };
  const stop = () => { wanted = false; revision++; clear(); audio?.pause(); emit('off'); };
  const fail = () => { stop(); emit('error'); };
  const playing = () => { if (!wanted || disposed) { audio?.pause(); return; } clear(); emit('playing'); };
  const paused = () => { if (wanted) { wanted = false; revision++; clear(); emit('off'); } };
  return {
    async toggle() {
      if (disposed) return;
      if (wanted) { stop(); return; }
      wanted = true; const attempt = ++revision; emit('loading');
      try {
        if (!audio) {
          audio = createAudio(); audio.loop = true; audio.volume = 0.2;
          audio.addEventListener('playing', playing); audio.addEventListener('pause', paused); audio.addEventListener('error', fail);
        }
        timeout = setTimeout(() => { if (attempt === revision && wanted) fail(); }, 15_000);
        await audio.play();
        if (attempt === revision && wanted && !disposed) playing();
      } catch { if (attempt === revision && !disposed) fail(); }
    },
    stop,
    dispose() {
      disposed = true; stop();
      if (audio) {
        audio.removeEventListener('playing', playing); audio.removeEventListener('pause', paused); audio.removeEventListener('error', fail);
        audio.removeAttribute('src'); audio.load(); audio = null;
      }
    },
  };
}
