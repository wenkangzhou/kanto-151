'use client';
import { useT } from '@/lib/i18n/locale';
import Link from 'next/link';
import {BookOpen,Compass} from 'lucide-react';
export function KnowledgeTabs({encyclopedia=false}:{encyclopedia?:boolean}){
  const localize = useT();
 return <nav className="knowledge-tabs" aria-label={localize("图鉴与百科")}><Link href="/pokedex" aria-current={!encyclopedia?'page':undefined}><Compass size={23}/>{localize("宝可梦")}</Link><Link href="/pokedex/encyclopedia" aria-current={encyclopedia?'page':undefined}><BookOpen size={23}/>{localize("小百科")}</Link></nav>;
}
