'use client';
import {getLocale} from './i18n/locale';
import {translate} from './i18n/translate';
// Learning speech has its own adapter so recorded voices can replace it later.
export function stopLearningSpeech(){if(typeof window!=='undefined')window.speechSynthesis?.cancel();}
export function speakLearning(text:string){
  if(typeof window==='undefined'||!window.speechSynthesis)return;
  stopLearningSpeech();
  const speech=new SpeechSynthesisUtterance(translate(text,getLocale()));speech.lang=getLocale()==='en'?'en-US':'zh-CN';speech.rate=0.85;
  const voice=window.speechSynthesis.getVoices().find(v=>getLocale()==='en'?v.lang.startsWith('en'):v.lang==='zh-CN');if(voice)speech.voice=voice;
  window.speechSynthesis.speak(speech);
}
