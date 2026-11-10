'use client';

import Link from 'next/link';
import {ArrowRight,Star} from 'lucide-react';
import {MACHINE_STAR_COST} from '@/domain/learning';
import {useT} from '@/lib/i18n/locale';
import styles from './learning-result-next-step.module.css';

type Props={balance:number;pending:number;syncing:boolean;error:string;rewarded:boolean};

export function LearningResultNextStep({balance,pending,syncing,error,rewarded}:Props){
 const localize=useT();
 const confirmed=pending===0&&!syncing&&!error;
 const missing=Math.max(0,MACHINE_STAR_COST-balance);
 return <div className={styles.card}>
  <p className={styles.caption} role="status">{localize(!rewarded?'自由练习完成啦':pending>0?'这轮记录已保存在本机，星星同步后可兑换':syncing?'正在确认星星…':error?'星星暂时无法确认，请重试同步。':'星星已存入口袋')}</p>
  <div className={styles.balance}><span>{localize(confirmed?'当前星星口袋':'本机显示的星星')}</span><strong><Star size={23} fill="currentColor" aria-hidden="true"/>{localize(balance)}</strong></div>
  {confirmed?<p className={styles.progress}>{localize(missing===0?'已经攒够一个招式啦！':'再攒 {0} 颗星，就能兑换一个招式。',[missing])}</p>:<p className={styles.progress}>{localize(pending>0?'同步完成后，才能确认能否兑换招式。':'确认星星后，就能查看兑换进度。')}</p>}
  {confirmed&&missing===0&&<Link className={`button ${styles.cta}`} href="/learn/moves">{localize('去选招式')}<ArrowRight size={18} aria-hidden="true"/></Link>}
 </div>;
}
