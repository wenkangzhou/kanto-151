'use client';
import { useT } from '@/lib/i18n/locale';

import {useState,useSyncExternalStore} from 'react';
import {ArrowRight,Sparkles,X} from 'lucide-react';
import {discoverMove} from '@/domain/move-discovery';
import {pokemonById} from '@/domain/pokemon';
import {isVisitorDemo} from '@/lib/demo-mode';
import {useCollection} from './collection-provider';
import {PokemonArt} from './pokemon-art';
import {TypePicture} from './type-badge';
import {ReadAloud} from './read-aloud';
import {MovePicker} from './move-picker';
const key='kanto-move-discovery-v1';
const event='kanto-move-discovery';
const dismissed=new Set<string>();
function scope(){return isVisitorDemo()?'demo':'family';}
function storage(){return isVisitorDemo()?sessionStorage:localStorage;}
function read(){try{return dismissed.has(scope())||storage().getItem(key)==='done';}catch{return dismissed.has(scope());}}
function subscribe(callback:()=>void){window.addEventListener(event,callback);window.addEventListener('storage',callback);return()=>{window.removeEventListener(event,callback);window.removeEventListener('storage',callback);};}
function dismiss(){dismissed.add(scope());try{storage().setItem(key,'done');}catch{/* Keep dismissal for this visit even when storage is unavailable. */}window.dispatchEvent(new Event(event));}
export function MoveDiscovery(){
  const localize = useT();
 const {snapshot}=useCollection();
 const hidden=useSyncExternalStore(subscribe,read,()=>true);
 const offer=discoverMove(snapshot.team??[],snapshot.movePresets,snapshot.unlockedMoves);
 const [active,setActive]=useState<ReturnType<typeof discoverMove>>(null);
 if(active)return <MovePicker id={active.id} discovery={{slot:active.slot,moveId:active.move.id}} onClose={()=>setActive(null)}/>;
 if(hidden||!offer)return null;
 const partner=pokemonById.get(offer.id)!;
 const phrase=`${partner.name}还可以学会${offer.move.name}！一起试试新招式吧。`;
 return <aside className="move-discovery" aria-label={localize("学个新本领")}><PokemonArt pokemon={partner}/><div className="move-discovery-copy"><span><Sparkles size={16}/>{localize("学个新本领")}</span><h2>{localize(partner.name)}{localize("还会这一招！")}<ReadAloud systemFallback text={localize(phrase)} label={localize("听听新本领")}/></h2><div><strong>{localize(offer.move.name)}</strong><TypePicture type={offer.move.type} interactive={false}/></div></div><button className="button" onClick={()=>{setActive(offer);dismiss();}}>{localize("试试新招式")}<ArrowRight size={18}/></button><button className="move-discovery-close" aria-label={localize("关闭新本领提示，不再提醒")} onClick={dismiss}><X size={20}/></button></aside>;
}
