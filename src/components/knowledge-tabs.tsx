import Link from 'next/link';
import {BookOpen,Compass} from 'lucide-react';
export function KnowledgeTabs({encyclopedia=false}:{encyclopedia?:boolean}){
 return <nav className="knowledge-tabs" aria-label="图鉴与百科"><Link href="/pokedex" aria-current={!encyclopedia?'page':undefined}><Compass size={23}/>宝可梦</Link><Link href="/pokedex/encyclopedia" aria-current={encyclopedia?'page':undefined}><BookOpen size={23}/>小百科</Link></nav>;
}
