import {battleMoves,type BattleMove} from './battle-loadout';
import {pokemonById} from './pokemon';

export function moveRecommendationReasons(id:number,move:BattleMove,saved?:unknown){
 const pokemon=pokemonById.get(id);
 const equipped=battleMoves(id,saved);
 return {
  attackStyle:!!pokemon&&move.category===(pokemon.stats.attack>=pokemon.stats['special-attack']?'physical':'special'),
  newType:!equipped.some(current=>current.type===move.type),
 };
}

// Moves share a normalized power in friendly battles, so category and new type coverage matter most.
export function recommendedMachineMoves(id:number,candidates:BattleMove[],saved?:unknown):string[] {
 const pokemon=pokemonById.get(id);
 if(!pokemon)return [];
 const equipped=battleMoves(id,saved);
 const used=new Set(equipped.map(move=>move.id));
 const types=new Set(equipped.map(move=>move.type));
 const preferred=pokemon.stats.attack>=pokemon.stats['special-attack']?'physical':'special';
 const score=(move:BattleMove)=>Number(move.category===preferred)*2+Number(!types.has(move.type));
 return candidates.filter(move=>!used.has(move.id)&&score(move)>0).sort((a,b)=>
  score(b)-score(a)||a.name.localeCompare(b.name,'zh-CN')
 ).slice(0,3).map(move=>move.id);
}
