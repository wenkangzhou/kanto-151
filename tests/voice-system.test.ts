import {test} from 'node:test';
import assert from 'node:assert/strict';
import {speakText,stopVoice,voiceSnapshot} from '../src/lib/voice-audio';
test('system narration can exceed fifteen seconds and cleans up on completion or switching', t => {
 t.mock.timers.enable({apis:['setTimeout']});
 const original={window:globalThis.window,SpeechSynthesisUtterance:globalThis.SpeechSynthesisUtterance};
 const speeches:Speech[]=[];
 class Speech {
  lang='';rate=1;voice=null;
  onstart:(()=>void)|null=null;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;
  constructor(public text:string){speeches.push(this);}
 }
 Object.assign(globalThis,{SpeechSynthesisUtterance:Speech,window:{dispatchEvent:()=>true,speechSynthesis:{getVoices:()=>[],speak:()=>{},cancel:()=>{}}}});
 try {
  speakText('article','这是介绍精灵球的长篇讲解。'.repeat(6),{systemFallback:true});
  speeches[0].onstart?.();t.mock.timers.tick(16000);assert.equal(voiceSnapshot().owner,'article');
  const staleEnd=speeches[0].onend;
  speakText('next','另一个精灵球的介绍',{systemFallback:true});
  staleEnd?.();assert.equal(voiceSnapshot().owner,'next');assert.equal(speeches[0].onstart,null);
  speeches[1].onstart?.();speeches[1].onend?.();assert.equal(voiceSnapshot().owner,'');assert.equal(voiceSnapshot().error,'');
  speakText('unavailable','无法启动的系统语音',{systemFallback:true});
  t.mock.timers.tick(15000);assert.equal(voiceSnapshot().owner,'');assert.match(voiceSnapshot().error,/暂时不可用/);
 } finally {stopVoice();Object.assign(globalThis,original);}
});
