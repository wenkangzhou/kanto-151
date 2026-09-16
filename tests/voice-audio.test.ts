import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import index from '../src/data/voice-index.json';
import catalog from '../data/voice/catalog.json';
import { speakText, stopVoice, voiceSnapshot } from '../src/lib/voice-audio';

test('recorded narration replaces, toggles, ignores stale callbacks and releases music focus on failures', async () => {
  const original = { window: globalThis.window, Audio: globalThis.Audio };
  const focus: boolean[] = [];
  const players: FakeAudio[] = [];
  const rejections: ((reason: Error) => void)[] = [];
  class FakeAudio {
    src = ''; volume = 1; preload = '';
    pauses = 0;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor() { players.push(this); }
    pause() { this.pauses++; }
    play() { return new Promise<void>((_, reject) => rejections.push(reject)); }
  }
  Object.assign(globalThis, { window: { dispatchEvent: (e: CustomEvent) => { focus.push(e.detail); return true; } }, Audio: FakeAudio });
  try {
    speakText('a', '皮卡丘');
    const player = players[0];
    assert.equal(player.src, `/audio/voices/${index['皮卡丘'][0]}.mp3`);
    const staleEnded = player.onended;
    speakText('b', '小火龙');
    assert.equal(players.length, 1, 'reuse the gesture-unlocked media element');
    assert.equal(player.pauses, 1);
    stopVoice('a');
    assert.equal(voiceSnapshot().owner, 'b');
    staleEnded?.();
    assert.equal(voiceSnapshot().owner, 'b');
    speakText('b', '小火龙');
    assert.equal(voiceSnapshot().owner, '');
    speakText('a', '皮卡丘');
    rejections[0](new Error('late rejection from the first a'));
    await Promise.resolve();
    assert.equal(voiceSnapshot().owner, 'a', 'same-owner replay survives an old promise rejection');
    player.onended?.();
    assert.equal(voiceSnapshot().owner, '');
    assert.equal(focus.at(-1), false);
    speakText('broken', '皮卡丘');
    player.onerror?.();
    assert.ok(voiceSnapshot().error);
    assert.equal(voiceSnapshot().owner, '');
    assert.equal(player.onerror, null);
    speakText('blocked', '皮卡丘');
    rejections.at(-1)!(new Error('NotAllowedError'));
    await Promise.resolve();
    assert.equal(voiceSnapshot().owner, '');
    assert.equal(focus.at(-1), false);
    const attempts = rejections.length;
    speakText('missing', '尚未生成的新文案');
    assert.equal(rejections.length, attempts, 'no runtime generation or system voice fallback');
    assert.ok(voiceSnapshot().error);
    assert.equal(voiceSnapshot().owner, '');
    speakText('navigation', '皮卡丘');
    stopVoice();
    assert.equal(player.onended, null);
    assert.equal(focus.at(-1), false);
  } finally { stopVoice(); Object.assign(globalThis, original); }
});

test('every catalog sentence has an indexed local recording', () => {
  const clips = index as Record<string, (string | number)[]>;
  assert.equal(Object.keys(clips).length, catalog.clips.length);
  for (const clip of catalog.clips) {
    assert.equal(clips[clip.text]?.[0], clip.id, clip.text);
    assert.ok(Number(clips[clip.text][1]) > 0, clip.text);
    assert.ok(existsSync(`public/audio/voices/${clip.id}.mp3`), clip.text);
  }
});
