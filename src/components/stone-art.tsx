import type {EvolutionStone} from '@/domain/evolution-stones';
// Lightweight original vector diagrams; not official item artwork.
export function StoneArt({stone}:{stone:EvolutionStone}){
 return <svg viewBox="0 0 180 180" role="img" aria-label={stone.name} style={{display:'block',width:'100%',height:'auto'}}>
  <ellipse cx="90" cy="160" rx="48" ry="7" fill="#29333a" opacity=".08"/>
  <path d="M54 22 114 16 151 59 142 128 102 155 45 137 26 77Z" fill={stone.color} stroke="#354844" strokeWidth="3" strokeLinejoin="round"/>
  <path d="m54 22 14 31 45-4 1-33Z" fill="#fff" opacity=".4"/><path d="m26 77 42-24-11 62-12 22Z" fill="#fff" opacity=".22"/><path d="m113 49 38 10-9 69-23-20Z" fill="#192e35" opacity=".16"/><path d="m57 115 45 40 40-27-23-20Z" fill="#192e35" opacity=".2"/>
  <path d="m68 53 45-4 6 59-62 7Z" fill={stone.light} opacity=".55"/>
  {stone.id==='fire'&&<path d="M90 54c4 22 22 22 19 43-2 14-27 18-36 3-7-13 9-24 11-34 5 8 3 10 6 12Z" fill="#ffcc62" stroke="#a75435" strokeWidth="2"/>}
  {stone.id==='water'&&<path d="M89 51c-7 18-24 34-23 46 1 26 46 26 47 0 1-14-17-30-24-46Z" fill="#a3eff3" stroke="#347d9a" strokeWidth="2"/>}
  {stone.id==='thunder'&&<path d="m94 48-27 43h20l-8 34 34-48H94l11-29Z" fill="#fff3a2" stroke="#82752d" strokeWidth="2" strokeLinejoin="round"/>}
  {stone.id==='leaf'&&<><path d="M66 112c-12-36 9-47 49-55-2 33-15 58-49 55Z" fill="#b5d793" stroke="#426b42" strokeWidth="2"/><path d="m61 123 41-52m-29 37 23-3m-18-5-2-14" fill="none" stroke="#567e49" strokeWidth="3" strokeLinecap="round"/></>}
  {stone.id==='moon'&&<><path d="m67 59 31-7 22 31-15 31-39-7-10-25Z" fill="#bac1d2" stroke="#666e85" strokeWidth="2"/><path d="m67 59 10 26-11 22m11-22 28 29m-28-29 43-2" fill="none" stroke="#8d96ad" strokeWidth="2"/></>}
  <path d="m47 63 8-25 21-3" fill="none" stroke="#fff" opacity=".6" strokeWidth="5" strokeLinecap="round"/>
 </svg>;
}
