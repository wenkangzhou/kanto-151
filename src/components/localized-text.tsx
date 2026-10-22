'use client';
import {useT} from '@/lib/i18n/locale';
/** A small client boundary for text inside otherwise server-rendered pages. */
export function LocalizedText({text}:{text:string}){const localize=useT();return <>{localize(text)}</>;}
