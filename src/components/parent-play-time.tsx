'use client';
import {useRouter} from 'next/navigation';
import {useCollection} from './collection-provider';
import {useCallback,useEffect,useState} from 'react';
import {Clock3,Play,LockKeyhole,Smartphone,Monitor} from 'lucide-react';
import {api} from '@/lib/api-client';
import {usePlayTime} from './play-time';
import {remainingSeconds,timeLabel,validMinutes,type PlayTime,type PlayTimeAction,type DeviceTimes} from '@/domain/play-time';
export function ParentPlayTime(){
 const [result,setResult]=useState<DeviceTimes|null>(null),[selected,setSelected]=useState(''),[error,setError]=useState(''),[controlling,setControlling]=useState(false);
 const {accept}=usePlayTime();
 const {refresh}=useCollection();const router=useRouter();
 async function returnToChild(){try{await api('parent/lock',{});await refresh();router.replace('/');}catch{setError('未能退出家长空间，请重试。');}}
 const load=useCallback(async()=>{try{setResult(await api<DeviceTimes>('parent/play-time'));setError('');}catch(e){setError(e instanceof Error?e.message:'读取失败，请重试。');}},[]);
 useEffect(()=>{const controller=new AbortController();api<DeviceTimes>('parent/play-time',undefined,controller.signal).then(setResult).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[]);
 const device=result?.devices.find(d=>d.id===selected)??result?.devices.find(d=>d.id===result.currentId)??result?.devices[0];
 return <section className="detail-panel parent-play-time"><div className="section-heading"><h2><Clock3 size={22}/>设备使用时间</h2><button className="text-link" disabled={controlling} onClick={()=>void load()}>刷新</button></div><p className="form-note">每台设备独立计时。可以限制孩子的 iPad，同时让开发电脑保持不限时。</p>{error&&<p role="alert" className="form-error">{error}</p>}
 {result?<><div className="time-device-tabs" role="group" aria-label="选择要管理的设备">{result.devices.map(d=><button key={d.id} disabled={controlling} aria-pressed={device?.id===d.id} onClick={()=>setSelected(d.id)}>{d.id===result.currentId?<Monitor size={20}/>:<Smartphone size={20}/>}<span><strong>{d.name}</strong><small>{d.id===result.currentId?'当前设备 · ':''}{d.time.enabled?`每日 ${d.time.minutes} 分钟`:'不限时'}</small></span></button>)}</div>{device&&<TimeControls key={device.id} data={device.time} name={device.name} deviceId={device.id} onUpdate={next=>{setResult(r=>r?{...r,devices:r.devices.map(d=>d.id===device.id?{...d,time:next}:d)}:r);if(device.id===result.currentId)accept(next);}} reload={load} onBusy={setControlling}/>}</>:<p role="status">正在读取设备…</p>}<button className="text-link" disabled={controlling} onClick={()=>void returnToChild()}>锁定家长空间，交还孩子</button></section>;
}
function TimeControls({data,name,deviceId,onUpdate,reload,onBusy}:{data:PlayTime;name:string;deviceId:string;onUpdate:(t:PlayTime)=>void;reload:()=>Promise<void>;onBusy:(busy:boolean)=>void}){
 const [draftMinutes,setMinutes]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [pending,setPending]=useState<{deviceId:string;action:PlayTimeAction;minutes:number;expected:number;requestId:string}|null>(null);
 const minutes=draftMinutes??data.minutes;
 async function control(action:PlayTimeAction){
  if(busy||!validMinutes(minutes))return;
  const payload=pending??{deviceId,action,minutes,expected:data.revision,requestId:crypto.randomUUID()};setPending(payload);setBusy(true);onBusy(true);setError('');setNotice('');
  try{const next=await api<PlayTime>('parent/play-time',payload);setPending(null);onBusy(false);setMinutes(null);onUpdate(next);setNotice(action==='configure'?'已保存，下次开启生效':action==='disable'?'这台设备已不限时':action==='lock'?'已通知这台设备休息':'已为这台设备重新开启时间');}
  catch(e){setError(e instanceof Error?e.message:'操作未完成，请重试。');}finally{setBusy(false);}
 }
 return <div className="device-time-controls"><div className="section-heading"><strong>{name}</strong><span className="play-time-state">{!data.enabled?'不限时':data.pendingDay?'今天尚未开始':remainingSeconds(data,Date.parse(data.serverNow))>0?`读取时剩余 ${timeLabel(remainingSeconds(data,Date.parse(data.serverNow)))}`:'休息中'}</span></div><div className="play-time-settings"><label htmlFor={`minutes-${deviceId}`}>每日时长</label><div className="time-presets">{[10,20,30].map(n=><button key={n} aria-pressed={minutes===n} disabled={busy||!!pending} onClick={()=>setMinutes(n)}>{n} 分钟</button>)}<label className="custom-minutes"><input id={`minutes-${deviceId}`} type="number" min={1} max={120} value={Number.isNaN(minutes)?'':minutes} disabled={busy||!!pending} onChange={e=>setMinutes(e.target.valueAsNumber)}/>分钟</label></div></div><p className="form-note">北京时间每日重置，这台设备当天首次打开时开始计时，离开应用也继续计时。学习与娱乐共用时长。远程操作通常在 15 秒内同步。</p><div className="action-row"><button className="button" disabled={busy||!!pending||!validMinutes(minutes)} onClick={()=>void control('start')}><Play size={17}/>{data.enabled?'重新开启一轮':'开启时间控制'}</button>{minutes!==data.minutes&&<button className="button secondary" disabled={busy||!!pending||!validMinutes(minutes)} onClick={()=>void control('configure')}>保存时长</button>}{data.enabled&&<><button className="button secondary" disabled={busy||!!pending} onClick={()=>void control('lock')}><LockKeyhole size={17}/>立即休息</button><button className="button secondary" disabled={busy||!!pending} onClick={()=>void control('disable')}>关闭时间控制</button></>}</div>{notice&&<p role="status" className="form-note">{notice}</p>}{error&&<p role="alert" className="form-error">{error}</p>}{pending&&!busy&&<div className="action-row"><button className="button secondary" onClick={()=>void control(pending.action)}>重试这次操作</button><button className="text-link" onClick={async()=>{await reload();setPending(null);onBusy(false);setError('');}}>重新读取状态</button></div>}</div>;
}
