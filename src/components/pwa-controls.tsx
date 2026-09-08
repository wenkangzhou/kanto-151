'use client';
import { useEffect, useState } from 'react';
import { Download, WifiOff } from 'lucide-react';
interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
export function PwaControls() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const updateNetwork = () => setOffline(!navigator.onLine);
    updateNetwork();
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('online', updateNetwork); window.removeEventListener('offline', updateNetwork); };
  }, []);
  if (offline) return <span className="network-badge"><WifiOff size={15} /> 离线浏览</span>;
  return prompt ? <button className="install-button" onClick={async () => { await prompt.prompt(); await prompt.userChoice; setPrompt(null); }}><Download size={16} /><span>安装</span></button> : null;
}
