import {test} from 'node:test';
import assert from 'node:assert/strict';
import {battleMoves,learnset,type BattleMove} from '../src/domain/battle-loadout';
import {moveRecommendationReasons,recommendedMachineMoves} from '../src/domain/move-recommendations';
import type {PokemonType} from '../src/domain/types';

test('suggestions favor stronger attack style and a new type without repeating equipped moves',()=>{
 const equipped=battleMoves(4);
 const currentType=equipped[0].type;
 const newType=(['ghost','dragon','fairy','dark'] as PokemonType[]).find(type=>!equipped.some(move=>move.type===type))!;
 const candidates:BattleMove[]=[
  {id:'physical-new',name:'甲',type:newType,category:'physical'},
  {id:'special-current',name:'乙',type:currentType,category:'special'},
  {id:'special-new',name:'丙',type:newType,category:'special'},
  equipped[0],
 ];
 assert.deepEqual(recommendedMachineMoves(4,candidates),['special-new','special-current','physical-new']);
 assert.deepEqual(moveRecommendationReasons(4,candidates[2]),{attackStyle:true,newType:true});
 assert.deepEqual(moveRecommendationReasons(4,candidates[0]),{attackStyle:false,newType:true});
 assert.ok(recommendedMachineMoves(4,learnset(4).machine).every(id=>!equipped.some(move=>move.id===id)));
});
