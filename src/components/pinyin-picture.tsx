import type {PinyinItem} from '@/domain/pinyin';
/** Locally drawn teaching pictures: no text is needed to recognize the object. */
export function PinyinPicture({item}:{item:PinyinItem}){
 return <svg viewBox="0 0 180 160" role="img" aria-label={item.word}>
  <ellipse cx="90" cy="144" rx="60" ry="7" fill="#dedbc8" opacity=".45"/>
  {item.picture==='mother'?<><path d="M43 87V53a47 47 0 0 1 94 0v45" fill="#675344"/><path d="M36 140q4-57 54-57t54 57" fill="#d5968c"/><ellipse cx="90" cy="59" rx="35" ry="40" fill="#f4d1ad"/><path d="M55 52Q60 7 92 19q32-2 36 35-27-4-42-25-8 20-31 23" fill="#675344"/><circle cx="77" cy="60" r="3" fill="#655342"/><circle cx="105" cy="60" r="3" fill="#655342"/><path d="M80 78q11 9 21-1" fill="none" stroke="#b46c63" strokeWidth="3" strokeLinecap="round"/></>:null}
  {item.picture==='rice'?<><path d="M33 80h114q-5 62-57 62T33 80" fill="#86a8b1"/><ellipse cx="90" cy="79" rx="57" ry="18" fill="#d5e5df"/>{Array.from({length:15},(_,i)=><ellipse key={i} cx={47+(i%5)*21} cy={66+Math.floor(i/5)*10} rx="10" ry="5" transform={`rotate(${i%2?25:-20} ${47+(i%5)*21} ${66+Math.floor(i/5)*10})`} fill="#fffcf0" stroke="#e2decb" strokeWidth="1.5"/>)}<path d="M71 114h38" stroke="#ecf2e8" strokeWidth="5" strokeLinecap="round"/></>:null}
  {item.picture==='tree'?<><path d="M79 81h22v63H79z" fill="#aa7f51"/><path d="M89 20C59 0 30 29 42 55 9 88 40 116 69 102c14 23 44 15 53-4 40 0 41-45 15-53-3-31-29-39-48-25" fill="#8fa977"/><path d="M89 127V63m0 40-22-20m22 7 22-19" stroke="#73905f" strokeWidth="7" fill="none" strokeLinecap="round"/></>:null}
  {item.picture==='eight'?<>{Array.from({length:8},(_,i)=><g key={i} transform={`translate(${37+i%4*35},${55+Math.floor(i/4)*49})`}><circle r="14" fill="#c98272"/><path d="M-13 0h26" stroke="#fff4df" strokeWidth="3"/><circle r="4" fill="#fff4df"/></g>)}</>:null}
  {item.picture==='pencil'?<g transform="rotate(32 90 80)"><path d="M76 27h28v96H76z" fill="#e9c86a"/><path d="M90 27h14v96H90z" fill="#cba748"/><path d="m76 123 14 27 14-27" fill="#e8c8a0"/><path d="m85 141 5 9 5-9" fill="#5e6455"/><path d="M76 27v-9q14-12 28 0v9" fill="#cd948b"/><path d="M76 28h28" stroke="#eee9cf" strokeWidth="7"/></g>:null}
  {item.picture==='cloth'?<><path d="m37 36 90 4 25 94-102 2z" fill="#9eafc2"/><path d="m52 36 9 100m14-99 9 99m14-98 10 97m15-96 12 95M42 60h91M46 86h94M48 112h99" stroke="#e1e7ea" strokeWidth="5"/><path d="m127 40 25 94-23-13z" fill="#7f93aa"/></>:null}
 </svg>;
}
