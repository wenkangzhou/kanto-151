import {TypeEncyclopedia} from '@/components/type-encyclopedia';
import {TYPE_NAMES, type PokemonType} from '@/domain/types';
export const metadata={title:'属性克制速查'};
type Query = {from?:string;attack?:string;defense?:string;defense2?:string;recap?:string};
const isType = (value:string|undefined):value is PokemonType => !!value && Object.hasOwn(TYPE_NAMES,value);
export default async function Page({searchParams}:{searchParams:Promise<Query>}){
 const query=await searchParams;
 const battle=query.from==='battle'&&isType(query.attack)&&isType(query.defense)?{
  attack:query.attack,
  defenders:isType(query.defense2)&&query.defense2!==query.defense?[query.defense,query.defense2]:[query.defense],
  recapToken:typeof query.recap==='string'&&/^[a-f0-9-]{36}$/.test(query.recap)?query.recap:undefined,
 }:undefined;
 return <TypeEncyclopedia battle={battle}/>;
}
