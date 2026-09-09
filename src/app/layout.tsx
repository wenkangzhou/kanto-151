import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { backgroundTrack } from '@/lib/background-music';
import type { Metadata, Viewport } from 'next';
import { CollectionProvider } from '@/components/collection-provider';
import { Shell } from '@/components/shell';
import './globals.css';
import { getRuntimeConfig } from '@/lib/server/runtime-config';
export const metadata: Metadata = {
  title: { default: 'Kanto 151 · 我的关都冒险手帐', template: '%s · Kanto 151' },
  description: '把每一份成长，珍藏成与宝可梦的相遇。属于我们家的关都 151 图鉴。',
  applicationName: 'Kanto 151', appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Kanto 151' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#e54a3c' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const live = Boolean(getRuntimeConfig());
  return <html lang="zh-CN"><body><a href="#main-content" className="skip-link">跳到主要内容</a><CollectionProvider live={live}><Shell musicAvailable={existsSync(join(process.cwd(), 'public', backgroundTrack.source))}>{children}</Shell></CollectionProvider></body></html>;
}
