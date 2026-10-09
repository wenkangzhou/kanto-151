import {machineAvailable,resolvedSlots,slotMoves,type MovePresets} from './battle-loadout';
// Offer only a legal, already-open move the partner has not equipped.
export function discoverMove(team:readonly number[],presets:MovePresets={},unlocked:readonly string[]=[]){
 for(const id of team){
  const saved=resolvedSlots(id,presets[id]);
  for(let slot=0;slot<4;slot++){
   const move=slotMoves(id,slot).find(m=>!saved.includes(m.id)&&(slot<2||machineAvailable(id,m.id,unlocked)));
   if(move)return {id,slot,move};
  }
 }
 return null;
}
