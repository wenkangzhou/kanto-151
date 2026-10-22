'use client';
import {useEffect} from 'react';
import {Languages} from 'lucide-react';
import {getLocale,setLocale,useLocale} from '@/lib/i18n/locale';
import {stopLearningSpeech} from '@/lib/learning-speech';
import {stopVoice} from '@/lib/voice-audio';
export function LanguageSwitch(){
 const locale=useLocale();
 useEffect(()=>{document.documentElement.lang=locale==='en'?'en':'zh-CN';stopVoice();stopLearningSpeech();},[locale]);
 return <label className="language-switch"><Languages size={17} aria-hidden="true"/><span className="sr-only">{locale==='en'?'Language':'语言'}</span><select aria-label={locale==='en'?'Language':'语言'} value={locale} onChange={event=>{if(event.target.value!==getLocale()){stopVoice();setLocale(event.target.value==='en'?'en':'zh');}}}><option value="zh">中文</option><option value="en">English</option></select></label>;
}
