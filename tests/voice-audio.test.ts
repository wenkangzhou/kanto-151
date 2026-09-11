import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speakText, stopVoice, voiceSnapshot } from '../src/lib/voice-audio';

test('narration replaces previous speech, toggles off, and cleans up on navigation or errors', () => {
  const original = { window: globalThis.window, speechSynthesis: globalThis.speechSynthesis, SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance };
  class Utterance {
    lang = ''; rate = 1; volume = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }
  const spoken: Utterance[] = [];
  let canceled = 0;
  const speech = { getVoices: () => [], cancel: () => { canceled++; }, speak: (utterance: Utterance) => { spoken.push(utterance); } };
  Object.assign(globalThis, { window: { dispatchEvent: () => true, speechSynthesis: speech }, speechSynthesis: speech, SpeechSynthesisUtterance: Utterance });
  try {
    speakText('a', '皮卡丘');
    assert.equal(spoken[0].text, '皮卡丘');
    assert.equal(spoken[0].lang, 'zh-CN');
    speakText('b', '小火龙');
    assert.equal(canceled, 1);
    assert.equal(spoken[0].onend, null);
    stopVoice('a');
    assert.equal(voiceSnapshot().owner, 'b');
    speakText('b', '小火龙');
    assert.equal(voiceSnapshot().owner, '');
    assert.equal(canceled, 2);
    speakText('words', '说明');
    stopVoice();
    assert.equal(canceled, 3);
    assert.equal(voiceSnapshot().owner, '');
    speakText('broken', '说明');
    spoken[3].onerror?.();
    assert.ok(voiceSnapshot().error);
    assert.equal(voiceSnapshot().owner, '');
    assert.equal(spoken[3].onerror, null);
  } finally { stopVoice(); Object.assign(globalThis, original); }
});
