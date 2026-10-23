import {test} from 'node:test';
import assert from 'node:assert/strict';
import {speakText,stopVoice,voiceSnapshot} from '../src/lib/voice-audio';
import voiceIndex from '../src/data/voice-index.json';
test('short cues time out promptly while long narration tolerates buffering and offers retry',async(t)=>{
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
  const longText=Object.entries(voiceIndex).find(([,clip])=>Number(clip[1])>=10000)![0];
  speakText('article',longText);
  const longAudio=players[0];
  assert.equal(voiceSnapshot().loading,true);
  t.mock.timers.tick(15000);
  assert.equal(voiceSnapshot().owner,'article');
  longAudio.onplaying?.();longAudio.onwaiting?.();
  t.mock.timers.tick(15000);
  assert.equal(voiceSnapshot().owner,'article');
  longAudio.onplaying?.();
  assert.equal(voiceSnapshot().loading,false);
  longAudio.onwaiting?.();
  t.mock.timers.tick(30000);
  assert.equal(voiceSnapshot().owner,'');
  assert.equal(voiceSnapshot().failedOwner,'article');
  assert.match(voiceSnapshot().error,/再点一次/);
  speakText('article',longText);
  assert.equal(voiceSnapshot().failedOwner,undefined);
 }finally{stopVoice();Object.assign(globalThis,original);}
});
