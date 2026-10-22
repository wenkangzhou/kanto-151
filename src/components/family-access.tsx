'use client';
import { useT } from '@/lib/i18n/locale';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ShieldCheck, Link2 } from 'lucide-react';
import { useCollection } from './collection-provider';
import { PokeballLoader } from './pokeball-loader';
import { api } from '@/lib/api-client';
export function FamilyGate() {
  const localize = useT();
  const { status, error, refresh } = useCollection();
  if (status === 'loading') return <div className="page"><PokeballLoader label={localize("正在打开家庭手帐…")} /></div>;
  return <div className="page"><section className="feature-preview"><BookOpen size={42} /><h1>{localize(status === 'setup-required' ? '为家人翻开第一章' : status === 'error' ? '手帐暂时没有打开' : '连接我们的家庭手帐')}</h1><p>{localize(error || (status === 'setup-required' ? '请家长先设置家庭名称和 PIN，然后就可以开始冒险。' : '输入家长生成的设备连接码，就能打开属于你们的冒险。'))}</p><div className="action-row">{status === 'error' ? <button className="button" onClick={() => void refresh()}>{localize("重新连接")}</button> : <Link className="button" href={status === 'setup-required' ? '/setup' : '/connect'}>{localize(status === 'setup-required' ? '家长初始化' : '连接设备')}</Link>}<Link className="text-link" href="/setup">{localize("家长初始化 / 恢复")}</Link></div><a className="demo-entry-link" href="/demo">{localize("先体验一下演示")}</a></section></div>;
}
export function FamilyAccess({ setup = false }: { setup?: boolean }) {
  const localize = useT();
  const { live, refresh, status } = useCollection();
  const router = useRouter();
  const [recover, setRecover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (setup && data.get('pin') !== data.get('confirmPin')) { setError('两次 PIN 不一致，请检查。'); return; }
    setBusy(true); setError('');
    try {
      const values = Object.fromEntries(data.entries());
      await api(setup ? recover ? 'recover' : 'setup' : 'pair', values);
      form.reset(); await refresh(); router.replace(setup ? '/parent/dashboard' : '/');
    } catch (error) { setError(error instanceof Error ? error.message : '请重试。'); }
    finally { setBusy(false); }
  }
  if (!live) return <div className="page"><div className="empty-state"><h2>{localize("当前是示例冒险")}</h2><p>{localize("配置家庭服务后即可连接真实手帐。")}</p><Link href="/pokedex" className="button">{localize("回到图鉴")}</Link></div></div>;
  return <div className="page"><div className="access-card"><span className="feature-icon">{setup ? <ShieldCheck size={32} /> : <Link2 size={32} />}</span><h1>{localize(setup ? recover ? '恢复家长访问' : '开启我们的家庭手帐' : '连接家庭设备')}</h1><p>{localize(setup ? '初始化口令来自部署时的 APP_SETUP_TOKEN，仅供家长首次设置或恢复使用。' : '请在家长空间生成连接码。每个码只能用一次，15 分钟内有效。')}</p>
    {setup && <div className="mode-switch"><button type="button" aria-pressed={!recover} onClick={() => setRecover(false)}>{localize("首次设置")}</button><button type="button" aria-pressed={recover} onClick={() => setRecover(true)}>{localize("已有家庭 / 忘记 PIN")}</button></div>}
    <form onSubmit={submit} className="family-form">{setup ? <><label>{localize("初始化口令")}<input name="setupToken" type="password" required maxLength={200} autoComplete="off" /></label>{!recover && <><label>{localize("家庭名称")}<input name="familyName" required maxLength={40} placeholder={localize("我们的冒险小队")} autoComplete="off" /></label><label>{localize("孩子的昵称")}<input name="childName" required maxLength={30} placeholder={localize("小小冒险家")} autoComplete="off" /></label></>}<label>{localize(recover ? '设置新的家长 PIN' : '家长 PIN')}<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="new-password" placeholder={localize("6 位数字")} /></label><label>{localize("再次输入 PIN")}<input name="confirmPin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="new-password" /></label>{recover && <p className="form-note">{localize("恢复会更新家长 PIN 并锁定已有家长会话，收藏和成长记录会保留。")}</p>}</> : <><label>{localize("设备连接码")}<input name="code" required maxLength={20} autoCapitalize="characters" autoComplete="off" placeholder="XXXX-XXXX-XXXX" /></label><label>{localize("给这个设备起个名字")}<input name="deviceName" required maxLength={40} placeholder={localize("孩子的平板")} autoComplete="off" /></label></>}
    {error && <p className="form-error" role="alert">{localize(error)}</p>}<button className="button" disabled={busy}>{localize(busy ? '正在打开…' : setup ? recover ? '恢复并打开手帐' : '创建家庭手帐' : '连接设备')}</button></form>
    {setup && status === 'unpaired' && <Link className="text-link" href="/connect">{localize("我有设备连接码")}</Link>}<Link className="back-link" href="/">{localize("返回首页")}</Link>
  </div></div>;
}
