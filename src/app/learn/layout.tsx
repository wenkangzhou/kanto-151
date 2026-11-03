'use client';

import { useState, type ReactNode } from 'react';
import { useCollection } from '@/components/collection-provider';
import { enterVisitorDemo } from '@/lib/demo-mode';
import { useT } from '@/lib/i18n/locale';

export default function LearnLayout({ children }: { children: ReactNode }) {
  const localize = useT();
  const { status } = useCollection();
  const [error, setError] = useState('');

  if (status !== 'demo') return children;

  function startDemo() {
    try {
      enterVisitorDemo();
      window.location.reload();
    } catch {
      setError('浏览器未允许保存演示数据，请开启此网站的存储权限后重试。');
    }
  }

  return <div className="page"><section className="access-card">
    <h1>{localize('学习需要先进入演示冒险')}</h1>
    <p>{localize('当前没有连接家庭数据。进入演示后，学习记录只保存在当前标签页，不影响真实家庭。')}</p>
    <button type="button" className="button" onClick={startDemo}>{localize('开始一场演示冒险')}</button>
    {error && <p className="form-error" role="alert">{localize(error)}</p>}
  </section></div>;
}
