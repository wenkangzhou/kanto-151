'use client';
import { useT } from '@/lib/i18n/locale';

import Link from 'next/link';
import {useCallback,useEffect,useId,useMemo,useRef,useState} from 'react';
import {ArrowLeft,Check,ChevronRight,Search,Star,X} from 'lucide-react';
import {learnset,machineAvailable,resolvedSlots,slotMoves,type BattleMove,type MoveSlots} from '@/domain/battle-loadout';
import {MACHINE_STAR_COST,type LearningState} from '@/domain/learning';
import {recommendedMachineMoves} from '@/domain/move-recommendations';
import {pokemonById} from '@/domain/pokemon';
import {TYPE_NAMES,type PokemonType} from '@/domain/types';
import {api} from '@/lib/api-client';
import {learningClient} from '@/lib/learning-client';
import {useCollection} from './collection-provider';
import {PokemonArt} from './pokemon-art';
import {TypePicture} from './type-badge';
import {ReadAloud} from './read-aloud';

type Offer={move:BattleMove;partners:number[]};
export function MoveShop(){
  const localize = useT();
 const {snapshot,refresh}=useCollection();
 const [learning,setLearning]=useState<LearningState|null>(null),[error,setError]=useState('');
 const [sync,setSync]=useState({pending:0,syncing:false,error:''});
 const [search,setSearch]=useState(''),[type,setType]=useState<PokemonType|null>(null),[filter,setFilter]=useState<'all'|'locked'|'owned'>('all');
 const [partnerFilter,setPartnerFilter]=useState<number|'all'|null>(null);
 const [selected,setSelected]=useState<Offer|null>(null);
 const load=useCallback(async()=>{try{await learningClient().flush();setLearning(await api<LearningState>('learning'));setError('');}catch(e){setError(e instanceof Error?e.message:'学习星暂时无法读取。');}},[]);
 useEffect(()=>{const client=learningClient();const update=()=>{const view=client.getSnapshot();setSync({pending:view.pending,syncing:view.syncing,error:view.error});};const unsubscribe=client.subscribe(update);update();return unsubscribe;},[]);
 useEffect(()=>{const controller=new AbortController();learningClient().flush().then(()=>api<LearningState>('learning',undefined,controller.signal)).then(setLearning).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[]);
 const catalog=useMemo(()=>{
  const offers=new Map<string,Offer>();
  for(const {pokemonId} of snapshot.records)for(const move of learnset(pokemonId).machine){
   const offer=offers.get(move.id);if(offer){if(!offer.partners.includes(pokemonId))offer.partners.push(pokemonId);}else offers.set(move.id,{move,partners:[pokemonId]});
  }
  return [...offers.values()].sort((a,b)=>a.move.name.localeCompare(b.move.name,'zh-CN'));
 },[snapshot.records]);
 const unlocked=learning?.unlocked??snapshot.unlockedMoves??[];
 const team=snapshot.team??[];
 const partnerChoices=snapshot.records.map(record=>record.pokemonId).filter(id=>learnset(id).machine.length>0).sort((a,b)=>Number(team.includes(b))-Number(team.includes(a))||a-b);
 const partner=typeof partnerFilter==='number'?pokemonById.get(partnerFilter):undefined;
 const recommended=partner?recommendedMachineMoves(partner.id,learnset(partner.id).machine,snapshot.movePresets?.[partner.id]):[];
 const visible=partnerFilter===null?[]:catalog.filter(o=>(partnerFilter==='all'||o.partners.includes(partnerFilter))&&(!type||o.move.type===type)&&(filter==='all'||(filter==='owned'?unlocked.includes(o.move.id):!unlocked.includes(o.move.id)&&(partnerFilter==='all'?o.partners.some(id=>!machineAvailable(id,o.move.id,unlocked)):!machineAvailable(partnerFilter,o.move.id,unlocked))))&&(!search.trim()||[o.move.name,localize(o.move.name),o.move.id.replace(/-/g,' ')].some(name=>name.toLowerCase().includes(search.trim().toLowerCase()))||o.partners.some(id=>{const p=pokemonById.get(id);return p&&[p.name,p.englishName].some(name=>name.toLowerCase().includes(search.trim().toLowerCase()));}))).sort((a,b)=>partner?(recommended.indexOf(a.move.id)<0?99:recommended.indexOf(a.move.id))-(recommended.indexOf(b.move.id)<0?99:recommended.indexOf(b.move.id)):0);
 return <div className="page move-shop"><Link className="back-link" href="/learn"><ArrowLeft size={18}/>{localize("回学习小站")}</Link>
  <div className="page-heading"><div><h1>{localize("招式兑换")}<span className="title-dot">.</span></h1><p>{localize("挑一个招式，送给喜欢的伙伴。")}</p></div><strong className="learning-balance"><Star/>{localize(learning?.balance??'—')}</strong></div>
  {error&&<p role="alert" className="form-error">{localize(error)}<button className="text-link" onClick={()=>void load()}>{localize("重试")}</button></p>}
  <div className="shop-partner-filter"><label htmlFor="shop-partner">{localize('先选一位伙伴')}</label><select id="shop-partner" value={partnerFilter??''} onChange={e=>{const value=e.target.value;setPartnerFilter(value==='all'?'all':value?Number(value):null);setFilter('all');setType(null);setSearch('');}}><option value="">{localize('选择要学招式的伙伴')}</option><option value="all">{localize('查看全部招式')}</option><optgroup label={localize('小队伙伴')}>{partnerChoices.filter(id=>team.includes(id)).map(id=><option key={id} value={id}>{localize(pokemonById.get(id)!.name)}</option>)}</optgroup><optgroup label={localize('精灵中心')}>{partnerChoices.filter(id=>!team.includes(id)).map(id=><option key={id} value={id}>{localize(pokemonById.get(id)!.name)}</option>)}</optgroup></select>{partner&&<p>{localize('优先展示这位伙伴擅长的出招方式和新属性。')}</p>}</div>
  {partnerFilter===null?<div className="shop-empty">{localize("先选一位伙伴，看看它能学哪些招式。")}</div>:<>
  <div className="shop-tools"><div className="filter-tabs">{([['all','全部'],['locked','可兑换'],['owned','已兑换']] as const).map(([key,label])=><button key={key} className={filter===key?'selected':''} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{localize(label)}</button>)}</div><label className="search-box"><Search size={18}/><input aria-label={localize("查找招式或伙伴")} placeholder={localize("招式或伙伴名字")} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label={localize("清空搜索")} onClick={()=>setSearch('')}><X size={18}/></button>}</label></div>
  <div className="shop-types" role="group" aria-label={localize("按招式属性筛选")}><button aria-pressed={type===null} onClick={()=>setType(null)}>{localize("全部属性")}</button>{(Object.keys(TYPE_NAMES) as PokemonType[]).filter(t=>catalog.some(o=>o.move.type===t)).map(t=><button key={t} aria-label={localize(`${TYPE_NAMES[t]}属性`)} aria-pressed={type===t} onClick={()=>setType(t)}><TypePicture type={t} interactive={false}/></button>)}</div>
  <p className="shop-count" role="status">{localize(visible.length)}{localize("个招式 · 尚未开放的招式每个")}{localize(MACHINE_STAR_COST)}{localize("星，兑换后永久共享")}</p>
  <div className="shop-grid">{visible.map(offer=>{const owned=unlocked.includes(offer.move.id),freeForPartner=partner&&machineAvailable(partner.id,offer.move.id,unlocked),previewPartners=partner?[partner.id,...offer.partners.filter(id=>id!==partner.id)]:offer.partners;return <div key={offer.move.id} className="move-audio-card shop-audio-card"><button className="shop-card" onClick={()=>setSelected(offer)}><div><strong>{localize(offer.move.name)}</strong><TypePicture type={offer.move.type} interactive={false}/></div>{partner&&recommended.includes(offer.move.id)&&<span className="shop-recommend-badge">{localize("优先看看")}</span>}<div className="shop-partner-preview">{previewPartners.slice(0,4).map(id=><PokemonArt key={id} pokemon={pokemonById.get(id)!}/>)}{offer.partners.length>4&&<span>+{localize(offer.partners.length-4)}</span>}</div><footer><span>{owned?<><Check size={17}/>{localize("已兑换")}</>:freeForPartner?<><Check size={17}/>{localize("可直接装备")}</>:<><Star size={17}/>{localize(MACHINE_STAR_COST)}</>}</span><small>{localize(offer.partners.length)}{localize("位伙伴能学")}<ChevronRight size={16}/></small></footer></button><ReadAloud systemFallback text={localize(offer.move.name)} label={localize(`朗读${offer.move.name}`)}/></div>;})}</div>
  {!visible.length&&<div className="shop-empty">{localize(catalog.length?'没有找到，换个名字或属性试试。':'先去冒险认识伙伴，再来看看它们能学的招式。')}<Link className="text-link" href={catalog.length?'/learn':'/'}>{localize(catalog.length?'回学习小站':'去冒险')}</Link></div>}
  </>}
  {selected&&<ShopMove key={selected.move.id} offer={selected} initialPartner={partner?.id} learning={learning} syncBlocked={sync.pending>0||sync.syncing||!!sync.error} onLearning={setLearning} onClose={()=>setSelected(null)} refresh={refresh}/>}
 </div>;
}
function ShopMove({offer,initialPartner,learning,syncBlocked,onLearning,onClose,refresh}:{offer:Offer;initialPartner?:number;learning:LearningState|null;syncBlocked:boolean;onLearning:(s:LearningState)=>void;onClose:()=>void;refresh:()=>Promise<void>}){
  const localize = useT();
 const {snapshot,saveMoves}=useCollection();const {move,partners}=offer;
 const dialog=useRef<HTMLDialogElement>(null),saving=useRef(false),title=useId();
 const [partner,setPartner]=useState<number|null>(initialPartner??null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[equippedNow,setEquippedNow]=useState(false);
 const [preset,setPreset]=useState<{saved:MoveSlots;expected:MoveSlots|null}|null>(()=>initialPartner?{saved:resolvedSlots(initialPartner,snapshot.movePresets?.[initialPartner]),expected:snapshot.movePresets?.[initialPartner]??null}:null);
 useEffect(()=>{const el=dialog.current,previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';el?.showModal();return()=>{el?.close();document.body.style.overflow=overflow;if(previous instanceof HTMLElement)previous.focus();};},[]);
 const unlocked=learning?.unlocked??snapshot.unlockedMoves??[];
 const available=partner!==null&&machineAvailable(partner,move.id,unlocked);
 const inTeam=partner!==null&&(snapshot.team??[]).includes(partner);
 function choose(id:number){setPartner(id);setPreset({saved:resolvedSlots(id,snapshot.movePresets?.[id]),expected:snapshot.movePresets?.[id]??null});setError('');setNotice('');setEquippedNow(false);}
 async function unlock(){
  if(partner===null||saving.current)return;saving.current=true;setBusy(true);setError('');
  try{await learningClient().flush();if(learningClient().getSnapshot().pending)throw Error('学习记录还在同步，星星同步后就能兑换。');const next=await api<LearningState>('learning',{action:'unlock',pokemonId:partner,moveId:move.id,requestId:crypto.randomUUID()});onLearning(next);setNotice('已兑换！选一个技能机位置装备。');await refresh();}
  catch(e){setError(e instanceof Error?e.message:'兑换失败，请重试。');}finally{saving.current=false;setBusy(false);}
 }
 async function equip(slot:number){
  if(partner===null||!preset||!available||saving.current||preset.saved.includes(move.id))return;
  saving.current=true;setBusy(true);setError('');const next:MoveSlots=[...preset.saved];next[slot]=move.id;
  try{await saveMoves(partner,next,preset.expected);setPreset({saved:next,expected:next});setNotice(`${pokemonById.get(partner)!.name}学会${move.name}啦！`);setEquippedNow(true);}
  catch(e){setError(e instanceof Error?e.message:'没有保存成功，请重新选择伙伴。');await refresh();setPartner(null);setPreset(null);}finally{saving.current=false;setBusy(false);}
 }
 return <dialog ref={dialog} className="loadout-dialog shop-dialog" aria-labelledby={title} onCancel={e=>{e.preventDefault();if(!saving.current)onClose();}}><header><h2 id={title}>{localize(move.name)}<ReadAloud systemFallback text={localize(move.name)} label={localize(`朗读${move.name}`)}/></h2><button className="opponent-close" aria-label={localize("关闭招式兑换")} disabled={busy} onClick={onClose} autoFocus><X/></button></header><div className="loadout-dialog-content"><div className="shop-move-summary"><TypePicture type={move.type} interactive={false}/><strong className="learning-balance"><Star size={20}/>{localize(learning?.balance??'—')}</strong></div>
  {partner===null?<><h3>{localize("谁来学？")}</h3><div className="shop-partners">{partners.map(id=><button key={id} onClick={()=>choose(id)}><PokemonArt pokemon={pokemonById.get(id)!}/><strong>{localize(pokemonById.get(id)!.name)}</strong><small>{localize(machineAvailable(id,move.id,unlocked)?'可直接装备':`${MACHINE_STAR_COST} 星兑换`)}</small></button>)}</div></>:<><button className="back-link" disabled={busy} onClick={()=>{setPartner(null);setNotice('');setError('');setEquippedNow(false);}}><ArrowLeft size={18}/>{localize("换一位伙伴")}</button><div className="shop-chosen"><PokemonArt pokemon={pokemonById.get(partner)!}/><strong>{localize(pokemonById.get(partner)!.name)}</strong></div>
  {available&&preset?<>{preset.saved.includes(move.id)?<p className="shop-equipped"><Check/>{localize("已装备")}</p>:<><h3>{localize("放在哪个位置？")}</h3><div className="move-slot-grid">{[2,3].map(slot=><div key={slot} className="move-audio-card"><button disabled={busy} onClick={()=>void equip(slot)}><small>{localize("技能机")}{localize(slot-1)}</small><strong>{localize(slotMoves(partner,slot).find(m=>m.id===preset.saved[slot])?.name??'空位')}</strong><span>{localize("换成")}{localize(move.name)}</span></button>{slotMoves(partner,slot).find(m=>m.id===preset.saved[slot])&&<ReadAloud systemFallback text={localize(slotMoves(partner,slot).find(m=>m.id===preset.saved[slot])!.name)} label={localize(`朗读${slotMoves(partner,slot).find(m=>m.id===preset.saved[slot])!.name}`)}/>}</div>)}</div></>}</>:<div className="shop-buy"><p>{localize("兑换一次，所有能学的伙伴都可以用。")}</p>{syncBlocked&&<p role="status">{localize("学习记录还在同步，星星同步后就能兑换。")}</p>}<button className="button" disabled={busy||syncBlocked||!learning||learning.balance<MACHINE_STAR_COST} onClick={()=>void unlock()}><Star size={20}/>{localize(busy?'兑换中…':`${MACHINE_STAR_COST} 星兑换`)}</button>{learning&&learning.balance<MACHINE_STAR_COST&&<Link className="text-link" href="/learn" onClick={onClose}>{localize("还差")}{localize(MACHINE_STAR_COST-learning.balance)}{localize("星 · 去学习")}</Link>}</div>}
  </>}{error&&<p className="form-error" role="alert">{localize(error)}</p>}{notice&&<p className="shop-notice" role="status">{localize(notice)}</p>}{equippedNow&&partner!==null&&<div className="shop-next-step">{!inTeam&&<p>{localize('{0}还没加入小队，先邀请它一起出发。',[localize(pokemonById.get(partner)!.name)])}</p>}<Link className="button shop-battle-link" href={inTeam?`/battle?partner=${partner}&move=${encodeURIComponent(move.id)}`:`/team?partner=${partner}&move=${encodeURIComponent(move.id)}`}>{localize(inTeam?'去对战试试':'先加入小队')}<ChevronRight size={18} aria-hidden="true"/></Link></div>}
 </div></dialog>;
}
