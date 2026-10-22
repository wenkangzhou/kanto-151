'use client';
import { useT } from '@/lib/i18n/locale';

import {useState,useSyncExternalStore} from 'react';
import {WifiOff,RefreshCw} from 'lucide-react';
import {useCollection} from './collection-provider';
const subscribe=(changed:()=>void)=>{
 window.addEventListener('online',changed);window.addEventListener('offline',changed);
 return()=>{window.removeEventListener('online',changed);window.removeEventListener('offline',changed);};
};
export function NetworkNotice(){
  const localize = useT();
 const online=useSyncExternalStore(subscribe,()=>navigator.onLine,()=>true);
 const {error,refresh,live,status}=useCollection();
 const [retrying,setRetrying]=useState(false);
 if(online&&(!live||!error||status!=='ready'))return null;
 return <aside className="network-notice" role="status"><WifiOff size={19} aria-hidden="true"/><span>{localize(!online?'网络暂时断开，已显示的内容可以继续查看。领取奖励、开始新一轮练习需要联网。':'暂时未能更新手帐，当前显示的是上次读取的内容。')}{online&&error&&<small>{localize(error)}</small>}</span><button type="button" disabled={!online||retrying} onClick={async()=>{setRetrying(true);try{await refresh();}finally{setRetrying(false);}}}><RefreshCw size={16} aria-hidden="true"/>{localize(retrying?'正在重连…':'重新连接')}</button></aside>;
}
