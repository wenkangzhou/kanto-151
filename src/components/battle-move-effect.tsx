'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { BattleMove } from '@/domain/battle';
import type { PokemonType } from '@/domain/types';

const colors: Record<PokemonType,string> = {
  normal:'#c29a66',fire:'#ef7a35',water:'#389de0',electric:'#efba23',grass:'#6da84c',ice:'#75cbd7',fighting:'#de814c',poison:'#b579c8',ground:'#a17a4e',flying:'#a1c9da',psychic:'#d780b0',bug:'#92a849',rock:'#9f9075',ghost:'#8671b6',dragon:'#8276c9',dark:'#685d78',steel:'#86a5ad',fairy:'#e596cc',
};
function Particle({move,index}:{move:BattleMove;index:number}) {
  switch(move.type) {
    case 'fire': return <><path d="M0 28C-35 12-20-11-4-32C-3-13 14-13 12-26C38 1 27 26 0 28Z" fill="#f48336"/><path d="M0 22C-16 10-8 0 1-12C0 1 16 11 0 22Z" fill="#ffe388"/></>;
    case 'water': return <path d="M-32 0Q0-28 28 0Q0 28-32 0Z" fill="#50b9ef" stroke="#d9f5ff" strokeWidth="3"/>;
    case 'grass': return <><path d="M-28 16Q-22-28 29-17Q22 22-28 16Z" fill="#7db958"/><path d="M-24 14 22-13" stroke="#e5f4ca" strokeWidth="3"/></>;
    case 'ice': return <path d="M0-28 16 0 0 28-16 0ZM-24-16 0 0 24 16M-24 16 0 0 24-16" fill="#dcf9ff" stroke="#73c4d9" strokeWidth="4"/>;
    case 'ground': case 'rock': return <path d="M-24-10-4-24 23-10 18 17-7 24-26 8Z" fill={move.type==='ground'?'#aa7b4c':'#a29a88'} stroke="#dac9a8" strokeWidth="3"/>;
    case 'poison': return <><circle r="19" fill="#ba89d2"/><circle cx="-20" cy="-16" r="9" fill="#d0ade0"/><circle cx="21" cy="13" r="12" fill="#a777c0"/></>;
    case 'flying': return <path d="M-36-15Q26-32 32-12Q30 0 15-5M-38 3H36M-28 18Q10 30 29 11" fill="none" stroke="#a0c9d8" strokeWidth="5" strokeLinecap="round"/>;
    case 'psychic': case 'ghost': case 'dragon': case 'dark': return <><circle r="23" fill={colors[move.type]} opacity=".5"/><circle r="13" fill="none" stroke={colors[move.type]} strokeWidth="5"/><path d="M-35 10Q-10 32 22 18" stroke={colors[move.type]} strokeWidth="4" fill="none"/></>;
    case 'fairy': return <path d="M0-28 8-8 28 0 8 8 0 28-8 8-28 0-8-8Z" fill="#edabd7" stroke="#fff0fc" strokeWidth="3"/>;
    case 'bug': return <><path d="M-27 20 0-20 27 20" fill="none" stroke="#96ac57" strokeWidth="8" strokeLinecap="round"/><path d="M-26 3 0-31 26 3" fill="none" stroke="#d5e7a7" strokeWidth="4"/></>;
    case 'steel': return <path d="M-22 28-6-28 4-28-6 28M5 28 21-28 31-28 21 28" fill="#9db8c0"/>;
    default: return move.id.includes('scratch')||move.id.includes('claw')||move.id==='cut'
      ? <path d="M-26 25-7-26M-8 29 11-22M10 25 29-26" stroke="#c79870" strokeWidth="7" strokeLinecap="round"/>
      : <path d={index%2?'M-29-8-10-10-8-29 8-10 29-8 10 8 8 29-8 10-29 8Z':'M0-28 10-11 28-7 15 8 18 27 0 18-18 27-15 8-28-7-10-11Z'} fill={colors[move.type]} stroke="#fff2d8" strokeWidth="3"/>;
  }
}
/** Decorative SVG only: no remote assets, raster filters or gameplay timers. */
export function BattleMoveEffect({move,side,hits}:{move:BattleMove;side:'player'|'enemy';hits:boolean}) {
  const reduced=useReducedMotion();
  if(reduced)return null;
  const color=colors[move.type];
  return <svg className="battle-move-effect" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <g transform={side==='enemy'?'translate(1000 300) rotate(180)':undefined}>
      {move.type==='electric'?<motion.path d="M180 220 300 167 283 200 437 126 423 161 580 103 564 138 720 72 820 80" fill="none" stroke={color} strokeWidth="9" strokeLinejoin="round" initial={{pathLength:0,opacity:0}} animate={{pathLength:[0,1,1],opacity:[0,1,0]}} transition={{duration:1.3,times:[0,.75,1]}}/>:<>
        {move.type==='water'&&[0,1,2].map(i=><motion.path key={i} d={`M180 ${220+i*7} Q490 ${85+i*10} 820 ${80+i*6}`} fill="none" stroke={i===1?'#a1e3fb':'#57b2e2'} strokeWidth={i===1?8:5} strokeLinecap="round" initial={{pathLength:0,opacity:0}} animate={{pathLength:[0,1,1],opacity:[0,.85,0]}} transition={{duration:1.35,delay:i*.035}}/>)}
        {[0,1,2].map(i=><motion.g key={i} initial={{x:180,y:220,opacity:0,scale:.5}} animate={{x:[180,510,820],y:[220,125+(i-1)*22,80],opacity:[0,1,0],scale:[.5,1,.75],rotate:move.type==='rock'||move.type==='grass'?[0,100,180]:0}} transition={{duration:1.15,delay:i*.1,times:[0,.55,1]}}><Particle move={move} index={i}/></motion.g>)}
      </>}
      {hits&&<motion.g initial={{opacity:0}} animate={{opacity:[0,0,1,0]}} transition={{duration:1.5,times:[0,.72,.84,1]}}>
        {[0,60,120,180,240,300].map(angle=><path key={angle} d="M18 0H35" transform={`translate(820 80) rotate(${angle})`} stroke={color} strokeWidth="5" strokeLinecap="round"/>)}
      </motion.g>}
    </g>
  </svg>;
}
