import {battleMoves,type BattleMove} from './battle-loadout';
import {pokemonById} from './pokemon';

// Moves share a normalized power in friendly battles, so category and new type coverage matter most.
export function recommendedMachineMoves(id:number,candidates:BattleMove[],saved?:unknown):string[] {
 const pokemon=pokemonById.get(id);
 if(!pokemon)return [];
 const equipped=battleMoves(id,saved);
 const used=new Set(equipped.map(move=>move.id));
 const types=new Set(equipped.map(move=>move.type));
 const preferred=pokemon.stats.attack>=pokemon.stats['special-attack']?'physical':'special';
 return candidates.filter(move=>!used.has(move.id)).sort((a,b)=>
  (Number(b.category===preferred)*2+Number(!types.has(b.type)))-(Number(a.category===preferred)*2+Number(!types.has(a.type)))||a.name.localeCompare(b.name,'zh-CN')
 ).slice(0,3).map(move=>move.id);
}
