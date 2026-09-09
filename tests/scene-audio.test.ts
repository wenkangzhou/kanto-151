import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCuePlayer, sceneTracks } from '../src/lib/scene-audio';
function audio(play: () => Promise<void> = async () => {}) {
  const events = new Map<string, () => void>();
  return { volume: 1, paused: false, released: false, play,
    pause() { this.paused = true; }, load() {}, removeAttribute() { this.released = true; },
    addEventListener(name: string, fn: () => void) { events.set(name, fn); },
    removeEventListener(name: string) { events.delete(name); },
    emit(name: string) { events.get(name)?.(); },
  };
}
test('cue completion restores background music once; another receipt cannot stop it', () => {
  const clip = audio(); let resumes = 0; let source = '';
  const player = createCuePlayer(path => { source = path; return clip; }, () => () => { resumes++; });
  player.play('receipt-one', 'capture');
  assert.equal(source, sceneTracks.capture); assert.equal(clip.volume, .25);
  player.stop(true, 'receipt-two'); assert.equal(clip.paused, false);
  clip.emit('ended'); clip.emit('ended');
  assert.equal(resumes, 1); assert.equal(clip.released, true);
});
test('muting during a pending cue prevents late rejection from resuming background music', async () => {
  let reject!: (error: Error) => void; let resumes = 0;
  const clip = audio(() => new Promise<void>((_, no) => { reject = no; }));
  const player = createCuePlayer(() => clip, () => () => { resumes++; });
  player.play('receipt', 'gift'); player.stop(false);
  reject(new Error('aborted')); await Promise.resolve();
  assert.equal(resumes, 0); assert.equal(clip.released, true);
});
test('a missing clip restores background music without blocking the reward', () => {
  const clip = audio(); let resumes = 0;
  const player = createCuePlayer(() => clip, () => () => { resumes++; });
  player.play('receipt', 'evolution'); clip.emit('error');
  assert.equal(resumes, 1); assert.equal(clip.released, true);
});
