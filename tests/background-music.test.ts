import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMusicPlayer, supportsBackgroundMusic, type MusicState } from '../src/lib/background-music';
test('music excludes phones in either orientation and allows iPad / desktop large views', () => {
  const tablet = { width: 820, screenWidth: 820, screenHeight: 1180, coarse: true, userAgent: 'Macintosh Safari' };
  assert.equal(supportsBackgroundMusic(tablet), true);
  assert.equal(supportsBackgroundMusic({ ...tablet, width: 1180 }), true);
  assert.equal(supportsBackgroundMusic({ ...tablet, width: 600 }), false);
  assert.equal(supportsBackgroundMusic({ ...tablet, width: 932, screenWidth: 430, screenHeight: 932, userAgent: 'iPhone Safari' }), false);
  assert.equal(supportsBackgroundMusic({ ...tablet, width: 915, screenWidth: 412, screenHeight: 915, userAgent: 'Android Mobile' }), false);
  assert.equal(supportsBackgroundMusic({ ...tablet, width: 900, screenWidth: 400, screenHeight: 900 }), false);
  assert.equal(supportsBackgroundMusic({ ...tablet, width: 1280, coarse: false }), true);
});
function fakeAudio(play: () => Promise<void> = async () => {}) {
  const listeners = new Map<string, () => void>();
  return { loop: false, volume: 1, paused: false, released: false,
    play, pause() { this.paused = true; listeners.get('pause')?.(); }, load() {},
    removeAttribute() { this.released = true; },
    addEventListener(name: string, listener: () => void) { listeners.set(name, listener); },
    removeEventListener(name: string) { listeners.delete(name); },
    emit(name: string) { listeners.get(name)?.(); },
  };
}
test('music is lazy, loops, resumes the same audio and releases it on unmount', async () => {
  let created = 0; const audio = fakeAudio(); const states: MusicState[] = [];
  const player = createMusicPlayer(() => { created++; return audio; }, state => states.push(state));
  assert.equal(created, 0);
  await player.toggle(); assert.equal(created, 1); assert.equal(audio.loop, true); assert.equal(audio.volume, 0.2); assert.equal(states.at(-1), 'playing');
  await player.toggle(); assert.equal(audio.paused, true); assert.equal(states.at(-1), 'off');
  await player.toggle(); assert.equal(created, 1); assert.equal(states.at(-1), 'playing');
  player.dispose(); assert.equal(audio.released, true);
});
test('stopping during loading prevents a late play result from changing the switch to on', async () => {
  let resolve!: () => void; const audio = fakeAudio(() => new Promise<void>(done => { resolve = done; })); const states: MusicState[] = [];
  const player = createMusicPlayer(() => audio, state => states.push(state));
  const pending = player.toggle(); assert.equal(states.at(-1), 'loading');
  player.stop(); resolve(); await pending; audio.emit('playing');
  assert.equal(states.at(-1), 'off'); assert.equal(audio.paused, true); player.dispose();
});
test('a rejected play or media error never reports playing and can be retried', async () => {
  let reject = true; const audio = fakeAudio(async () => { if (reject) throw new Error('blocked'); }); const states: MusicState[] = [];
  const player = createMusicPlayer(() => audio, state => states.push(state));
  await player.toggle(); assert.equal(states.at(-1), 'error');
  reject = false; await player.toggle(); assert.equal(states.at(-1), 'playing');
  audio.emit('error'); assert.equal(states.at(-1), 'error'); player.dispose();
});
test('scene interruption preserves the music position and never resumes after mute', async () => {
  let plays = 0;
  const audio = fakeAudio(async () => { plays++; }); const states: MusicState[] = [];
  const player = createMusicPlayer(() => audio, state => states.push(state));
  await player.toggle();
  const resume = player.suspendForCue();
  assert.equal(audio.paused, true); assert.equal(states.at(-1), 'playing');
  resume(); await Promise.resolve(); assert.equal(plays, 2);
  const mutedResume = player.suspendForCue();
  player.stop(); mutedResume(); await Promise.resolve();
  assert.equal(plays, 2); assert.equal(states.at(-1), 'off'); player.dispose();
});
