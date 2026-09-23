import {test} from 'node:test';
import assert from 'node:assert/strict';
import {speakText,stopVoice,voiceSnapshot} from '../src/lib/voice-audio';
test('battle voice bounds loading and stalled playback without cutting a normally playing clip',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const original={window:globalThis.window,Audio:globalThis.Audio};
 const players:FakeAudio[]=[];
 class FakeAudio {
  src='';volume=1;preload='';onended:(()=>void)|null=null;onerror:(()=>void)|null=null;onplaying:(()=>void)|null=null;onwaiting:(()=>void)|null=null;
  constructor(){players.push(this);} pause(){} play(){return new Promise<void>(()=>{});}
 }
 Object.assign(globalThis,{window:{dispatchEvent:()=>true},Audio:FakeAudio});
 try{
  speakText('battle','皮卡丘',{loadTimeoutMs:2500});assert.equal(voiceSnapshot().loading,true);
  t.mock.timers.tick(2499);assert.equal(voiceSnapshot().owner,'battle');t.mock.timers.tick(1);assert.equal(voiceSnapshot().owner,'');
  speakText('battle','皮卡丘',{loadTimeoutMs:2500});const audio=players[0];t.mock.timers.tick(2000);audio.onplaying?.();
  t.mock.timers.tick(1000);assert.equal(voiceSnapshot().owner,'battle');assert.equal(voiceSnapshot().loading,false);
  audio.onwaiting?.();t.mock.timers.tick(2500);assert.equal(voiceSnapshot().owner,'');assert.equal(audio.onplaying,null);
  speakText('battle','皮卡丘',{loadTimeoutMs:2500});stopVoice();t.mock.timers.tick(5000);assert.equal(voiceSnapshot().owner,'');
 }finally{stopVoice();Object.assign(globalThis,original);}
});
