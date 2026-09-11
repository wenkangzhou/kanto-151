'use client';
export const voiceFocusEvent = 'kanto-voice-focus';
export type VoiceState = { owner: string; error: string };
const idle: VoiceState = { owner: '', error: '' };
let state = idle;
let release: (() => void) | undefined;
const listeners = new Set<() => void>();
export const voiceSnapshot = () => state;
export const voiceServerSnapshot = () => idle;
export function subscribeVoice(callback: () => void) { listeners.add(callback); return () => { listeners.delete(callback); }; }
const emit = (next: VoiceState) => { state = next; listeners.forEach(callback => callback()); };
const focus = (active: boolean) => window.dispatchEvent(new CustomEvent(voiceFocusEvent, { detail: active }));
export function stopVoice(owner?: string) {
  if (owner && owner !== state.owner) return;
  const cleanup = release; release = undefined; cleanup?.(); emit(idle); focus(false);
}
function begin(owner: string) {
  stopVoice(); emit({ owner, error: '' }); focus(true);
  return (error = '') => { if (state.owner !== owner) return; const cleanup = release; release = undefined; cleanup?.(); emit({ owner: '', error }); focus(false); };
}
export function speakText(owner: string, text: string) {
  if (state.owner === owner) { stopVoice(owner); return; }
  const done = begin(owner);
  if (!('speechSynthesis' in window)) { done('这台设备暂不支持朗读。'); return; }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN'; utterance.rate = .85; utterance.volume = .85;
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => /^zh[-_]CN$/i.test(v.lang)) ?? voices.find(v => /^zh[-_](TW|SG)$/i.test(v.lang));
  if (voice) utterance.voice = voice;
  const timer = setTimeout(() => done('朗读暂时没有响应，请再点一次。'), 60000);
  utterance.onend = () => done();
  utterance.onerror = () => done('朗读暂时不可用，请再试一次。');
  release = () => { clearTimeout(timer); utterance.onend = null; utterance.onerror = null; speechSynthesis.cancel(); };
  try { speechSynthesis.speak(utterance); } catch { done('朗读暂时不可用，请再试一次。'); }
}
