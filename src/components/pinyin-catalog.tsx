'use client';
import {useState} from 'react';
import {BookOpen,ChevronLeft,ChevronRight,Volume2} from 'lucide-react';
import {pinyinById,pinyinFinalExamples,pinyinInitialAudio,pinyinWholeIds,type PinyinItem} from '@/domain/pinyin';
import {PinyinPicture} from './pinyin-picture';
import styles from './pinyin-learning.module.css';

export function PinyinCatalog({items,muted,onPlay}:{items:PinyinItem[];muted:boolean;onPlay:(ids:string[])=>void}){
 const [page,setPage]=useState(0),[tab,setTab]=useState<'initial'|'final'|'whole'>('initial');
 const pages=Math.ceil(items.length/12);
 const initials='b p m f d t n l g k h j q x zh ch sh r z c s y w'.split(' ');
 return <>
  <section className={styles.explore}><h2><BookOpen size={20}/>先听一听</h2><div className={styles.cards}>{items.slice(page*12,(page+1)*12).map(item=><button key={item.id} disabled={muted} onClick={()=>onPlay([item.id])} aria-label={`听${item.text}，${item.word}`}><PinyinPicture item={item}/><strong>{item.text}</strong><span>{item.word}<Volume2 size={18}/></span>{item.whole&&<small>整体认读</small>}</button>)}</div>
  {pages>1&&<nav className={styles.catalogPager} aria-label="音节图卡翻页"><button disabled={page===0} onClick={()=>setPage(page-1)}><ChevronLeft size={18}/>上一组</button><span aria-live="polite">{page+1} / {pages}</span><button disabled={page===pages-1} onClick={()=>setPage(page+1)}>下一组<ChevronRight size={18}/></button></nav>}
  </section>
  <details className={styles.reference}><summary><BookOpen size={20}/>拼音点读表 · 随时回来听</summary>
   <div className={styles.referenceTabs} role="group" aria-label="点读表分类">{([['initial','声母与 y、w'],['final','韵母例音'],['whole','整体认读']] as const).map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</div>
   <p>{tab==='initial'?'点击听呼读音，y、w 听对应的 yi、wu。':tab==='final'?'点击听下面标出的完整例音，跟着例音找韵母。例音不是韵母的单独发音。':'这 16 个音节直接整体认读，不拆成声母和韵母。'}</p>
   <div className={styles.referenceGrid}>
    {tab==='initial'&&initials.map(text=><button key={text} disabled={muted} onClick={()=>onPlay([pinyinInitialAudio[text]])} aria-label={`听${text}的呼读音`}><b>{text}</b><Volume2 size={16}/></button>)}
    {tab==='final'&&pinyinFinalExamples.map(({text,example})=><button key={text} disabled={muted} onClick={()=>onPlay([example])} aria-label={`${text}，听例音${pinyinById.get(example)!.text}`}><b>{text}</b><small>例音 {pinyinById.get(example)!.text}</small><Volume2 size={16}/></button>)}
    {tab==='whole'&&pinyinWholeIds.map(id=>{const item=pinyinById.get(id)!;return <button key={id} disabled={muted} onClick={()=>onPlay([id])} aria-label={`整体认读${item.text}`}><b>{item.text}</b><small>{item.word}</small><Volume2 size={16}/></button>;})}
   </div>
  </details>
 </>;
}
