import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getLocale,setLocale} from '../src/lib/i18n/locale';
import {speakText,stopVoice,voiceSource,voiceSnapshot} from '../src/lib/voice-audio';
import {speakLearning,stopLearningSpeech} from '../src/lib/learning-speech';
test('English uses system speech, Chinese keeps recordings, and storage failure keeps the tab selection',()=>{
 const original={window:globalThis.window,localStorage:globalThis.localStorage,SpeechSynthesisUtterance:globalThis.SpeechSynthesisUtterance,Audio:globalThis.Audio};
 const saved=new Map<string,string>();const spoken:Utterance[]=[];let mediaCount=0;
 class Utterance {lang='';rate=1;voice:unknown;onstart:(()=>void)|null=null;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(public text:string){}}
 class AudioStub {src='';volume=1;preload='';pause(){}play(){return Promise.resolve();}constructor(){mediaCount++;}}
 Object.assign(globalThis,{localStorage:{getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>saved.set(key,value)},SpeechSynthesisUtterance:Utterance,Audio:AudioStub,window:{dispatchEvent:()=>true,speechSynthesis:{cancel(){},getVoices:()=>[{lang:'en-US'},{lang:'zh-CN'}],speak:(speech:Utterance)=>{spoken.push(speech);speech.onstart?.();}}}});
 try{
  assert.equal(getLocale(),'zh');
  setLocale('en');assert.equal(saved.get('kanto-language'),'en');
  assert.equal(voiceSource('皮卡丘'),undefined,'English must not preload Chinese recordings');
  speakText('type','电');assert.equal(spoken.at(-1)?.text,'Electric');assert.equal(spoken.at(-1)?.lang,'en-US');assert.equal(mediaCount,0);
  stopVoice();assert.equal(voiceSnapshot().owner,'');
  speakLearning('13减8等于几？');assert.equal(spoken.at(-1)?.text,'What is 13 minus 8?');assert.equal(spoken.at(-1)?.lang,'en-US');
  setLocale('zh');assert.ok(voiceSource('皮卡丘'));
  speakText('partner','皮卡丘');assert.equal(mediaCount,1);stopVoice();
  Object.assign(globalThis,{localStorage:{setItem(){throw new Error('blocked');}}});setLocale('en');assert.equal(getLocale(),'en');
 }finally{stopVoice();stopLearningSpeech();setLocale('zh');Object.assign(globalThis,original);}
});
