'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCollection } from './collection-provider';
import { exitVisitorDemo } from '@/lib/demo-mode';
import { resetDemoData } from '@/lib/demo-api';
export function DemoEntry() {
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    void import('@/lib/demo-mode').then(({ enterVisitorDemo }) => {
      if (cancelled) return;
      enterVisitorDemo(); window.location.replace('/');
    }).catch(() => { if (!cancelled) setError('浏览器未允许保存演示数据，请开启此网站的存储权限后重试。'); });
    return () => { cancelled = true; };
  }, []);
  return <div className="page"><section className="access-card"><h1>开始一场演示冒险</h1><p>{error || '正在准备模拟家庭和伙伴…'}</p>{error && <a href="/demo" className="button">重试</a>}</section></div>;
}
export function DemoControls() {
  const { visitorDemo } = useCollection();
  const [error, setError] = useState('');
  if (!visitorDemo) return null;
  function reset(finale=false) {
    try { resetDemoData(finale); window.location.replace(new URL('/', window.location.origin).href); } catch { setError('未能重置，请检查浏览器存储权限。'); }
  }
  return <aside className="demo-toolbar" aria-label="演示模式">
    <details><summary>演示冒险 · 模拟数据</summary><div className="demo-help">
      <p>所有操作只保存在当前标签页，与真实家庭无关。</p>
      <p>奖励码：<b>111111</b> 开球 · <b>222222</b> 进化券 · <b>333333</b> 传说券；每个码使用一次，重置后可再体验。</p>
      <p>家长 PIN：<b>123456</b>，可以生成奖励、兑换并查看使用记录。</p>
      <div className="action-row"><Link href="/capture">打开奖励</Link><Link href="/bag">用进化券</Link><Link href="/battle">去对战</Link><Link href="/parent">家长中心</Link><button onClick={()=>reset(true)}>体验集齐 150 位后的相遇</button></div>
    </div></details>
    <div className="demo-toolbar-actions"><button onClick={()=>reset()}>重置演示</button><button onClick={()=>{try{exitVisitorDemo();}catch{setError('未能退出，请检查浏览器存储权限。');}}}>退出演示</button></div>
    {error && <p role="alert">{error}</p>}
  </aside>;
}
