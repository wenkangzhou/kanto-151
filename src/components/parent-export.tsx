'use client';
import {useRef,useState} from 'react';
import {Download} from 'lucide-react';
import {api} from '@/lib/api-client';
import {useT} from '@/lib/i18n/locale';
import {useCollection} from './collection-provider';

export function ParentExport() {
  const localize=useT();
  const {visitorDemo}=useCollection();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [saved,setSaved]=useState(false);
  const active=useRef(false);
  async function download() {
    if(active.current||visitorDemo)return;
    active.current=true;setBusy(true);setError('');setSaved(false);
    try {
      const data=await api<Record<string,unknown>>('parent/export');
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const link=document.createElement('a');
      link.href=url;link.download='kanto-family-'+new Date().toISOString().slice(0,10)+'.json';
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60_000);
      setSaved(true);
    } catch(error) {setError(error instanceof Error?error.message:'导出失败，请重试。');}
    finally {active.current=false;setBusy(false);}
  }
  return <section className="parent-export">
    <div><h2><Download size={23} aria-hidden="true"/>{localize('保存家庭数据')}</h2>
    <p>{localize('下载收藏、奖励券、相遇、学习进度和设置，留一份自己的记录。')}</p>
    <p className="form-note">{localize('只包含已同步到服务器的数据；其他设备尚未同步的练习不在其中。文件含家庭记录和奖励码，请妥善保管。')}</p>
    <p className="form-note">{localize('不包含 PIN 或设备登录凭据。目前提供导出，暂不支持在应用内导入恢复。')}</p></div>
    <button className="button secondary" disabled={busy||visitorDemo} onClick={()=>void download()}><Download size={18}/>{localize(busy?'正在整理数据…':'下载数据文件')}</button>
    {visitorDemo&&<p className="form-note">{localize('演示模式不导出真实家庭数据。')}</p>}
    {saved&&<p role="status" className="form-note">{localize('已发起下载，请在浏览器下载列表或文件 App 中确认保存。')}</p>}
    {error&&<p role="alert" className="form-error">{localize(error)}</p>}
  </section>;
}
