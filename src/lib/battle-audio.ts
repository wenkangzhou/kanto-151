import { preparedAudio } from './battle-assets';
import type { PokemonType } from '@/domain/types';
export const battleAudioEvent = 'kanto-battle-audio';
export type BattleAudioRequest = { owner: string; action: 'enter' | 'leave' | 'win' | 'rest' | 'throw' | 'hit'; moveType?:PokemonType };
export function battleSound(owner: string, action: BattleAudioRequest['action'], moveType?:PokemonType) {
  window.dispatchEvent(new CustomEvent<BattleAudioRequest>(battleAudioEvent,{detail:{owner,action,moveType}}));
}
export interface BattleAudio {
  loop: boolean; volume: number;
  play(): Promise<void>; pause(): void; load(): void; removeAttribute(name:string):void;
}
export function createBattleAudio(create: (source:string)=>BattleAudio, suspend:()=>()=>void) {
  let owner=''; let enabled=false; let speaking=false; let ended=false;
  let music:BattleAudio|undefined; let cue:BattleAudio|undefined; let resume:(()=>void)|undefined;
  let cleanupCue:ReturnType<typeof setTimeout>|undefined;
  const release=(audio:BattleAudio|undefined)=>{audio?.pause();audio?.removeAttribute('src');audio?.load();};
  const stopCue=()=>{clearTimeout(cleanupCue);release(cue);cue=undefined;};
  const stop=()=>{release(music);music=undefined;stopCue();};
  const playTrack=(victory=false)=>{
    if(!enabled||!owner)return;
    resume??=suspend();
    release(music);
    const next=create(victory?'/audio/battle/victory.mp3':'/audio/battle/trainer.mp3');
    music=next;next.loop=!victory;next.volume=speaking ? .035 : victory ? .2 : .12;
    try{void next.play().catch(()=>{if(music===next){release(next);music=undefined;}});}catch{release(next);music=undefined;}
  };
  return {
    get active(){return Boolean(owner&&enabled);},
    setEnabled(value:boolean){enabled=value;if(!enabled){stop();resume=undefined;}else if(owner&&!music&&!ended)playTrack();},
    voice(value:boolean){speaking=value;if(music)music.volume=value ? .035 : ended ? .2 : .12;if(cue)cue.volume=value ? .06 : .18;},
    request(request:BattleAudioRequest){
      if(request.action==='enter'){owner=request.owner;ended=false;stopCue();playTrack();return;}
      if(request.owner!==owner)return;
      if(request.action==='leave'){owner='';ended=false;stop();const restore=resume;resume=undefined;restore?.();return;}
      if(request.action==='win'||request.action==='rest'){ended=true;stopCue();if(request.action==='win')playTrack(true);else{release(music);music=undefined;}return;}
      if(!enabled||ended)return;
      stopCue();const next=create(preparedAudio(request.action==='hit'&&request.moveType?`/audio/battle/types/${request.moveType}.wav`:`/audio/battle/${request.action}.wav`));cue=next;next.loop=false;next.volume=speaking ? .06 : .18;
      // Loading and playback have separate deadlines; a cold request must not be cut at 700ms.
      cleanupCue=setTimeout(()=>{if(cue===next)stopCue();},2500);
      try{void next.play().then(()=>{if(cue!==next)return;clearTimeout(cleanupCue);cleanupCue=setTimeout(()=>{if(cue===next)stopCue();},700);}).catch(()=>{if(cue===next)stopCue();});}catch{stopCue();}
    },
    dispose(){owner='';stop();const restore=resume;resume=undefined;restore?.();},
  };
}
