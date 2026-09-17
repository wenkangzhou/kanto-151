import { pokemon, pokemonById } from '@/domain/pokemon';
import { capturePool, evolutionOptions, legendaryEligible, currentChapter } from '@/domain/collection';
import type { FamilySession, LiveSnapshot, ParentReward, Receipt } from '@/domain/types';

type Reward = ParentReward & { requestId?: string; receiptId?: string };
export type DemoData = { version: 1; snapshot: LiveSnapshot; parent: boolean; rewards: Reward[]; receipts: Receipt[]; used: Record<string, string>; devices: { id: string; name: string }[] };
const now = () => new Date().toISOString();
const reasons = ['独立整理好书包', '认真读完一本书', '帮助家人收拾餐桌', '遇到困难又试了一次'];
export function createDemoData(finale = false): DemoData {
  const omitted = new Set([2,3,5,6,8,9,11,12,26]);
  const records = pokemon.filter(p => finale ? p.id < 151 : p.id <= 120 && !omitted.has(p.id)).map((p,i) => ({pokemonId:p.id,acquiredAt:new Date(Date.UTC(2026,8,1+i%15,8)).toISOString(),reason:reasons[i%reasons.length],method:'capture' as const}));
  const tickets = [{id:'demo-evolution',type:'evolution' as const,reason:'坚持练习，迎接新的成长',createdAt:now()},{id:'demo-legendary',type:'legendary' as const,reason:'勇敢尝试一次特别的冒险',createdAt:now()}];
  const rewards: Reward[] = (['capture','evolution','legendary'] as const).map((type,i)=>({id:`demo-reward-${i}`,code:['111111','222222','333333'][i],type,reason:reasons[i],created_at:now(),expires_at:new Date(Date.now()+86400000*30).toISOString(),redeemed_at:null,revoked_at:null}));
  return {version:1,snapshot:{source:'sandbox',records,team:[25,4,7,1,16,19],inventory:{evolution:1,legendary:1},tickets,pendingReceipt:null},parent:false,rewards,receipts:[],used:{},devices:[{id:'demo-this',name:'演示平板'},{id:'demo-phone',name:'演示家长手机'}]};
}
export function handleDemo(data: DemoData, path: string, body?: Record<string, unknown>): unknown {
  const [route,query] = path.split('?');
  const s=data.snapshot;
  const fail=(message:string):never=>{throw new Error(message);};
  const receipt=(id:unknown)=>data.receipts.find(r=>r.id===id) ?? fail('没有找到这次演示相遇。');
  const recount=()=>{s.inventory={evolution:s.tickets.filter(t=>t.type==='evolution').length,legendary:s.tickets.filter(t=>t.type==='legendary').length};};
  const make=(kind:Receipt['kind'],pokemonId:number|null,reason:string,ticketId:string|null=null,from:number|null=null)=>{
    const previousChapter = currentChapter(s);
    const r:Receipt={id:crypto.randomUUID(),kind,pokemon_id:pokemonId,from_pokemon_id:from,ticket_id:ticketId,reason,created_at:now(),acknowledged_at:null,route_version:'anime-v1'};
    if(pokemonId&&!s.records.some(p=>p.pokemonId===pokemonId))s.records.push({pokemonId,reason,acquiredAt:r.created_at,method:kind==='evolution'?'evolution':kind==='legendary'||kind==='mew'?'legendary':'capture'});
    if (previousChapter && currentChapter(s)?.id !== previousChapter.id) r.completed_chapter = previousChapter.id;
    data.receipts.push(r);s.pendingReceipt=r;return r;
  };
  if(route==='session')return {status:'ready',familyName:'演示家庭',childName:'小小冒险家',parent:data.parent,snapshot:s} satisfies FamilySession;
  if(route==='team') {
    const team=body?.team as number[];const expected=body?.expected;
    if(!Array.isArray(team)||team.length>6||new Set(team).size!==team.length||team.some(id=>!s.records.some(r=>r.pokemonId===id)))fail('请选择最多六位已认识的伙伴。');
    if(JSON.stringify(expected)!==JSON.stringify(s.team))fail('小队已变化，请刷新后再试。');
    s.team=[...team];return s;
  }
  if(route==='parent/unlock'){if(body?.pin!=='123456')fail('演示 PIN 是 123456。');data.parent=true;return {};}
  if(route==='parent/lock'){data.parent=false;return {};}
  if(route.startsWith('parent/')&&!data.parent)fail('请用演示 PIN 123456 打开家长空间。');
  if(route==='parent/rewards'&&!body){const page=Number(new URLSearchParams(query).get('page')||0);const all=[...data.rewards].reverse();return {rewards:all.slice(page*30,page*30+30),hasMore:all.length>(page+1)*30};}
  if(route==='parent/rewards'&&body){
    const existing=data.rewards.find(r=>r.requestId===body.requestId);if(existing)return existing;
    if(!['capture','evolution','legendary'].includes(String(body.type)))fail('请选择奖励类型。');
    const r:Reward={id:crypto.randomUUID(),requestId:String(body.requestId),code:String(400000+data.rewards.length),type:body.type as ParentReward['type'],reason:String(body.reason||''),created_at:now(),expires_at:new Date(Date.now()+86400000*30).toISOString(),redeemed_at:null,revoked_at:null};data.rewards.push(r);return r;
  }
  if(route==='parent/rewards/revoke'){const r=data.rewards.find(r=>r.id===body?.id);if(!r||r.redeemed_at)fail('该演示奖励不能撤销。');r!.revoked_at=now();return {};}
  if(route==='redeem'){
    const r=data.rewards.find(r=>r.code===body?.code);if(!r||r.revoked_at)fail('请输入演示奖励码，或到演示家长中心生成。');
    if(r!.receiptId)return receipt(r!.receiptId);
    let result:Receipt;
    if(r!.type==='capture'){const target=capturePool(s)[0];if(!target)fail('这段演示的普通伙伴已集齐，可重置后再体验。');result=make('capture',target.id,r!.reason);}
    else {const type=r!.type==='evolution'?'evolution':'legendary';result=make(type==='evolution'?'evolution-ticket':'legendary-ticket',null,r!.reason);s.tickets.push({id:r!.id,type,reason:r!.reason,createdAt:now()});recount();}
    r!.receiptId=result.id;r!.redeemed_at=now();r!.outcome={state:result.pokemon_id?'met':'stored',usedAt:null,pokemonId:result.pokemon_id,fromPokemonId:null};return result;
  }
  if(route==='tickets/use'){
    const id=String(body?.ticketId);if(data.used[id])return receipt(data.used[id]);
    const t=s.tickets.find(t=>t.id===id);if(!t)fail('这张演示券不存在。');
    const target=pokemonById.get(Number(body?.targetId));
    if(!target||(t!.type==='evolution'?!evolutionOptions(s).some(p=>p.id===target.id):target.id===151||!legendaryEligible(target.id,s)))fail('这位伙伴还不能用这张券相遇。');
    const result=make(t!.type==='evolution'?'evolution':'legendary',target!.id,t!.reason,id,t!.type==='evolution'?target!.evolvesFrom:null);
    data.used[id]=result.id;s.tickets=s.tickets.filter(t=>t.id!==id);recount();
    const r=data.rewards.find(r=>r.id===id);if(r)r.outcome={state:'used',usedAt:now(),pokemonId:target!.id,fromPokemonId:result.from_pokemon_id};return result;
  }
  if(route==='mew'){const old=data.receipts.find(r=>r.kind==='mew');if(old)return old;if(!legendaryEligible(151,s))fail('请先认识前 150 位伙伴。');return make('mew',151,'集齐伙伴，迎接最后的相遇');}
  if(route==='receipts/acknowledge'){const r=receipt(body?.id);r.acknowledged_at=now();if(s.pendingReceipt?.id===r.id)s.pendingReceipt=null;return {};}
  if(route.startsWith('receipts/'))return receipt(decodeURIComponent(route.slice(9)));
  if(route==='parent/devices')return {devices:data.devices,currentId:'demo-this'};
  if(route==='parent/devices/revoke'){data.devices=data.devices.filter(d=>d.id!==body?.id);return {};}
  if(route==='parent/pairing')return {code:'DEMO12345678',expiresAt:new Date(Date.now()+900000).toISOString()};
  if(route==='disconnect'){data.parent=false;return {};}
  if(route==='pair'){if(String(body?.code).replaceAll('-','')!=='DEMO12345678')fail('演示连接码是 DEMO12345678。');return {};}
  if(route==='setup'||route==='recover')fail('演示家庭已准备好，请用 PIN 123456 进入家长中心；初始化和恢复不会连接真实家庭。');
  return fail('这个操作暂不在演示范围内，不会发送到真实家庭。');
}
const storageKey='kanto-visitor-data-v1';
export function resetDemoData(finale=false){sessionStorage.setItem(storageKey,JSON.stringify(createDemoData(finale)));}
export function demoApi(path:string,body?:Record<string,unknown>){
  const raw=sessionStorage.getItem(storageKey);
  const data:DemoData=raw?JSON.parse(raw):createDemoData();
  if(data.version!==1)throw new Error('演示数据需要重置。');
  const result=handleDemo(data,path,body);
  sessionStorage.setItem(storageKey,JSON.stringify(data));
  return structuredClone(result);
}
