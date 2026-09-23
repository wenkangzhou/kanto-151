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
test('typed hit cues duck for narration and are released on the next challenge',()=>{
 const f=fixture();f.player.setEnabled(true);f.player.request({owner:'a',action:'enter'});
 f.player.voice(true);f.player.request({owner:'a',action:'hit',moveType:'water'});
 const water=f.tracks.at(-1)!;assert.equal(water.source,'/audio/battle/types/water.wav');assert.equal(water.volume,.06);
 f.player.voice(false);assert.equal(water.volume,.18);
 f.player.request({owner:'a',action:'hit',moveType:'electric'});assert.equal(water.paused,true);assert.match(f.tracks.at(-1)!.source,/electric.wav$/);
 const electric=f.tracks.at(-1)!;f.player.request({owner:'a',action:'enter'});assert.equal(electric.paused,true);f.player.dispose();
});
test('slow cues get a loading window then their full playback time; late starts cannot replace newer cues',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const starts:(()=>void)[]=[];
 const tracks:{paused:boolean;loop:boolean;volume:number;play:()=>Promise<void>;pause:()=>void;load:()=>void;removeAttribute:()=>void}[]=[];
 const player=createBattleAudio(()=>{const audio={paused:false,loop:false,volume:0,play:()=>new Promise<void>(resolve=>starts.push(resolve)),pause(){this.paused=true;},load(){},removeAttribute(){}};tracks.push(audio);return audio;},()=>()=>{});
 player.setEnabled(true);player.request({owner:'a',action:'enter'});player.request({owner:'a',action:'hit',moveType:'water'});
 t.mock.timers.tick(1000);assert.equal(tracks[1].paused,false);
 starts[1]();await Promise.resolve();t.mock.timers.tick(699);assert.equal(tracks[1].paused,false);t.mock.timers.tick(1);assert.equal(tracks[1].paused,true);
 player.request({owner:'a',action:'hit',moveType:'rock'});t.mock.timers.tick(2500);assert.equal(tracks[2].paused,true);
 player.request({owner:'a',action:'hit',moveType:'electric'});starts[2]();await Promise.resolve();assert.equal(tracks[3].paused,false);
 player.dispose();assert.equal(tracks[3].paused,true);
});
