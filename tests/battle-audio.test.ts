import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBattleAudio} from '../src/lib/battle-audio';
function fixture(){
 const tracks:{source:string;loop:boolean;volume:number;paused:boolean;play:()=>Promise<void>;pause:()=>void;load:()=>void;removeAttribute:()=>void}[]=[];
 let suspended=0,resumed=0;
 const player=createBattleAudio(source=>{const audio={source,loop:false,volume:1,paused:false,async play(){},pause(){this.paused=true;},load(){},removeAttribute(){}};tracks.push(audio);return audio;},()=>{suspended++;return()=>{resumed++;};});
 return {player,tracks,get suspended(){return suspended;},get resumed(){return resumed;}};
}
test('battle music respects the switch, ducks during voice and resumes original music on exit',()=>{
 const f=fixture();f.player.request({owner:'a',action:'enter'});assert.equal(f.tracks.length,0);
 f.player.setEnabled(true);assert.equal(f.tracks[0].loop,true);assert.equal(f.tracks[0].volume,.12);assert.equal(f.suspended,1);
 f.player.voice(true);assert.equal(f.tracks[0].volume,.035);f.player.voice(false);assert.equal(f.tracks[0].volume,.12);
 f.player.request({owner:'other',action:'leave'});assert.equal(f.resumed,0);
 f.player.request({owner:'a',action:'leave'});assert.equal(f.resumed,1);assert.equal(f.tracks[0].paused,true);f.player.dispose();
});
test('victory is a short non-looping track; rematch and disposal release all audio',()=>{
 const f=fixture();f.player.setEnabled(true);f.player.request({owner:'a',action:'enter'});f.player.request({owner:'a',action:'throw'});
 f.player.request({owner:'a',action:'win'});assert.equal(f.tracks[0].paused,true);assert.equal(f.tracks[1].paused,true);assert.match(f.tracks[2].source,/victory/);assert.equal(f.tracks[2].loop,false);
 f.player.request({owner:'a',action:'enter'});assert.equal(f.tracks[2].paused,true);assert.equal(f.suspended,1);
 f.player.dispose();assert.ok(f.tracks.every(t=>t.paused));assert.equal(f.resumed,1);
});
test('switching sound off stops cues and prevents automatic resume',()=>{
 const f=fixture();f.player.setEnabled(true);f.player.request({owner:'a',action:'enter'});f.player.request({owner:'a',action:'hit'});f.player.setEnabled(false);
 assert.ok(f.tracks.every(t=>t.paused));f.player.request({owner:'a',action:'hit'});assert.equal(f.tracks.length,2);f.player.request({owner:'a',action:'leave'});assert.equal(f.resumed,0);f.player.dispose();
});
test('failed media playback cannot throw into the battle or resume another owner',async()=>{
 const player=createBattleAudio(()=>({loop:false,volume:0,play:async()=>{throw Error('blocked')},pause(){},load(){},removeAttribute(){}}),()=>()=>{});
 player.setEnabled(true);player.request({owner:'a',action:'enter'});player.request({owner:'a',action:'hit'});await Promise.resolve();player.dispose();
});
