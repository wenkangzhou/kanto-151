'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {stopLearningSpeech} from './learning-speech';
import {pinyinAudioIds as allowed} from '@/domain/pinyin';
/** Recorded pronunciation only. Never send pinyin letters to system TTS. */
export function usePinyinAudio(){
 const player=useRef<HTMLAudioElement|null>(null),revision=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [audioError,setAudioError]=useState(''),[playing,setPlaying]=useState(false);
 const stop=useCallback(()=>{revision.current++;clearTimeout(timer.current);if(player.current){player.current.pause();player.current.onended=null;player.current.onerror=null;player.current.onplaying=null;}setPlaying(false);},[]);
 const play=useCallback((ids:string[])=>{
  stop();stopLearningSpeech();setAudioError('');
  if(!ids.length||ids.some(id=>!allowed.has(id)))return;
  const token=revision.current;
  const audio=player.current??=new Audio();audio.preload='auto';let i=0;
  const fail=()=>{if(token!==revision.current)return;stop();setAudioError('声音没加载好，点喇叭再听一次。');};
  const next=()=>{
   if(token!==revision.current)return;
   clearTimeout(timer.current);
   if(i===ids.length){stop();return;}
   audio.src=`/audio/pinyin/${ids[i++]}.mp3`;
   timer.current=setTimeout(fail,12000);
   void audio.play().catch(fail);
  };
  audio.onplaying=()=>{if(token===revision.current)setPlaying(true);};audio.onerror=fail;audio.onended=next;next();
 },[stop]);
 useEffect(()=>{window.addEventListener('kanto-language',stop);return()=>window.removeEventListener('kanto-language',stop);},[stop]);
 useEffect(()=>()=>{revision.current++;clearTimeout(timer.current);player.current?.pause();if(player.current){player.current.onended=null;player.current.onerror=null;player.current.onplaying=null;}},[]);
 return {play,stop,audioError,playing};
}
