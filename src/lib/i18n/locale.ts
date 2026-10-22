'use client';
import {useSyncExternalStore} from 'react';
import {formatTranslation,type Locale} from './translate';
const key='kanto-language';
let cachedLocale:Locale|undefined;
const listeners=new Set<()=>void>();
export function getLocale():Locale {
 if(typeof window==='undefined')return 'zh';
 if(cachedLocale)return cachedLocale;
 try{cachedLocale=localStorage.getItem(key)==='en'?'en':'zh';}catch{cachedLocale='zh';}
 return cachedLocale;
}
function notify(){for(const listener of listeners)listener();}
function onStorage(event:StorageEvent){if(event.key===key||event.key===null){cachedLocale=undefined;notify();window.dispatchEvent(new Event('kanto-language'));}}
function subscribe(listener:()=>void){
 if(!listeners.size)window.addEventListener('storage',onStorage);
 listeners.add(listener);
 return()=>{listeners.delete(listener);if(!listeners.size)window.removeEventListener('storage',onStorage);};
}
export function setLocale(locale:Locale){
 cachedLocale=locale;
 try{localStorage.setItem(key,locale);}catch{/* Keep the selection for this tab when storage is unavailable. */}
 notify();window.dispatchEvent(new Event('kanto-language'));
}
const serverLocale=()=>'zh' as const;
export function useLocale(){return useSyncExternalStore(subscribe,getLocale,serverLocale);}
const chinese=<T,>(value:T,args?:readonly (string|number)[]):T=>formatTranslation(value,'zh',args);
const english=<T,>(value:T,args?:readonly (string|number)[]):T=>formatTranslation(value,'en',args);
export function useT(){return useLocale()==='en'?english:chinese;}
export function localeTag(){return getLocale()==='en'?'en-US':'zh-CN';}
