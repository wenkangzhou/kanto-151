'use client';
import { preparedAudio } from './battle-assets';
import voiceIndex from '@/data/voice-index.json';
export const voiceFocusEvent = 'kanto-voice-focus';
export type VoiceState = { owner: string; error: string; loading?: boolean };
const idle: VoiceState = { owner: '', error: '' };
let state = idle;
let release: (() => void) | undefined;
let player: HTMLAudioElement | undefined;
let generation = 0;
const clips = voiceIndex as Record<string, (string | number)[]>;
const listeners = new Set<() => void>();
export const voiceSnapshot = () => state;
export const voiceServerSnapshot = () => idle;
export function subscribeVoice(callback: () => void) { listeners.add(callback); return () => { listeners.delete(callback); }; }
const emit = (next: VoiceState) => { state = next; listeners.forEach(callback => callback()); };
const focus = (active: boolean) => window.dispatchEvent(new CustomEvent(voiceFocusEvent, { detail: active }));
export function stopVoice(owner?: string) {
  if (owner && owner !== state.owner) return;
  generation++;
  const cleanup = release; release = undefined; cleanup?.(); emit(idle); focus(false);
}
function begin(owner: string) {
  stopVoice(); emit({ owner, error: '' }); focus(true);
  const current = generation;
  return (error = '') => { if (current !== generation || state.owner !== owner) return; generation++; const cleanup = release; release = undefined; cleanup?.(); emit({ owner: '', error }); focus(false); };
}
export function voiceSource(text:string) { const clip=clips[text]; return clip?`/audio/voices/${clip[0]}.mp3`:undefined; }
export function speakText(owner: string, text: string, options:{loadTimeoutMs?:number}={}) {
  if (state.owner === owner) { stopVoice(owner); return; }
  const done = begin(owner);
  const loadingError=options.loadTimeoutMs?'声音暂时没加载好，先继续对战。':'语音加载超时，请再点一次。';
  const clip = clips[text];
  if (!clip) { done('这段语音还没有准备好。'); return; }
  try {
    // Reuse the element unlocked by the first tap, including subsequent battle turns on iPad.
    const audio = player ??= new Audio();
    audio.volume = .85;
    audio.preload = 'auto';
    let timer = setTimeout(() => done(loadingError), options.loadTimeoutMs ?? 15000);
    const current=generation;
    emit({owner,error:'',loading:true});
    audio.onplaying=()=>{if(current!==generation)return;clearTimeout(timer);emit({owner,error:'',loading:false});timer=setTimeout(()=>done('语音播放超时。'),Number(clip[1])+3000);};
    audio.onwaiting=()=>{if(current!==generation)return;clearTimeout(timer);emit({owner,error:'',loading:true});timer=setTimeout(()=>done(loadingError),options.loadTimeoutMs??15000);};
    audio.onended = () => done();
    audio.onerror = () => done('语音暂时不可用，请再试一次。');
    release = () => { clearTimeout(timer); audio.onended = null; audio.onerror = null; audio.onplaying=null; audio.onwaiting=null; audio.pause(); };
    audio.src = preparedAudio(`/audio/voices/${clip[0]}.mp3`);
    // No fetch/await before play: preserve the user's playback gesture on Safari.
    void audio.play().catch(() => done('语音暂时不可用，请再点一次。'));
  } catch { done('语音暂时不可用，请再试一次。'); }
}
