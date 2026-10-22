'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {useT} from '@/lib/i18n/locale';
const titles:Record<string,string>={
 '/':'我的关都冒险手帐','/parent':'家长空间','/parent/dashboard':'家长空间',
 '/parent/reward':'生成奖励','/parent/history':'奖励记录','/connect':'连接设备',
 '/setup':'家庭初始化','/capture':'兑换新相遇','/demo':'体验演示','/bag':'我的背包',
 '/battle':'友好对战','/team':'我的小队与精灵中心','/history':'成长足迹',
 '/learn':'去学习','/learn/pinyin':'拼音小站','/learn/thinking':'思维小站','/learn/moves':'招式兑换',
 '/pokedex':'宝可梦图鉴','/pokedex/encyclopedia':'宝可梦百科',
 '/pokedex/encyclopedia/evolution-stones':'神奇的进化石',
 '/pokedex/encyclopedia/types':'属性克制速查 · 火红／叶绿',
 '/pokedex/encyclopedia/poke-balls':'认识五种精灵球','/pokedex/encyclopedia/gyms':'道馆和徽章',
 '/dev/capture':'本地相遇动画预览',
};
/** Keep device-local language in the tab title without making static routes depend on cookies. */
export function LocalizedPageTitle(){
 const pathname=usePathname(),localize=useT();
 const id=/^\/pokemon\/(\d+)$/.exec(pathname)?.[1];
 const base=(id?localize(`#${id.padStart(3,'0')} · 伙伴档案`):localize(titles[pathname]??'Kanto 151'));
 const title=base==='Kanto 151'?base:base+' · Kanto 151';
 useEffect(()=>{
  const update=()=>{if(document.title!==title)document.title=title;};
  update();
  // Next may finish streaming route metadata after the client navigation commits.
  const observer=new MutationObserver(update);
  observer.observe(document.head,{childList:true,subtree:true,characterData:true});
  return()=>observer.disconnect();
 },[title]);
 return null;
}
