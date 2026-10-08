'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Compass, BookOpen, Backpack, Footprints, ShieldCheck, UsersRound, GraduationCap } from 'lucide-react';
import { useCollection } from './collection-provider';
import { BackgroundMusic } from './background-music';
import { PwaControls } from './pwa-controls';
import { DemoControls } from './visitor-demo';
import { VoiceLifecycle } from './voice-lifecycle';
import { PlayTimeProvider, PlayTimeBadge, PlayTimeNotice, PlayTimeRest, usePlayTime } from './play-time';
import { FamilyGate } from './family-access';
const links = [{ href: '/learn', name: '去学习', en: 'LEARN', icon: GraduationCap }, { href: '/', name: '去冒险', en: 'ADVENTURE', icon: Compass }, { href: '/pokedex', name: '宝可梦图鉴', en: 'POKÉDEX', icon: BookOpen }, { href: '/team', name: '我的小队', en: 'MY TEAM', icon: UsersRound }, { href: '/bag', name: '我的背包', en: 'BACKPACK', icon: Backpack }, { href: '/history', name: '成长足迹', en: 'MEMORIES', icon: Footprints }];
export function Shell({ children, musicAvailable = false }: { children: React.ReactNode; musicAvailable?: boolean }) {
  const { visitorDemo, status } = useCollection();
  return <PlayTimeProvider key={`${visitorDemo}:${status === 'ready'}`}><ShellContent musicAvailable={musicAvailable}>{children}</ShellContent></PlayTimeProvider>;
}
function ShellContent({ children, musicAvailable }: { children: React.ReactNode; musicAvailable: boolean }) {
  const pathname = usePathname();
  const { locked, expired } = usePlayTime();
  const parentPage = pathname.startsWith('/parent') || ['/setup','/connect','/demo'].includes(pathname);
  const { snapshot, demo, toggleDemo, live, status } = useCollection();
  return <div className={`app-shell ${pathname === '/battle' ? 'battle-shell' : ''}`}><VoiceLifecycle />
    <aside className="sidebar">
      <Link href="/" className="brand"><Image src="/logo-pokeball.png" alt="" width={46} height={46} unoptimized /><span>KANTO <b>151</b><small>我的关都冒险手帐</small></span></Link>
      <nav aria-label="主要导航" inert={locked && !parentPage}>{links.map(({ href, name, en, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${pathname === href || (href === '/learn' && pathname.startsWith('/learn/')) || (href === '/pokedex' && pathname.startsWith('/pokemon/')) ? 'active' : ''}`}><Icon size={21} strokeWidth={1.7} /><span>{name}<small>{en}</small></span></Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/parent" className="parent-link"><ShieldCheck size={18} /> 家长中心</Link></div>
    </aside>
    <div className="main-shell"><header className="topbar"><Link className="mobile-brand" href="/">KANTO <b>151</b></Link><div className="topbar-actions"><PlayTimeBadge />{!locked && <BackgroundMusic available={musicAvailable} />}<PwaControls /><Link className="mobile-parent-button" href="/parent"><ShieldCheck size={18} aria-hidden="true" /><span>家长中心</span></Link>{!live && <button className="preview-toggle" onClick={toggleDemo} title="切换示例收藏与全新图鉴"><span className={`status-dot ${demo ? '' : 'empty'}`} />{demo ? '示例冒险' : '全新图鉴'}<span className="toggle-label">切换</span></button>}</div></header>
      <DemoControls /><main id="main-content">{live && status !== 'ready' && !['/setup', '/connect', '/demo'].includes(pathname) && !(process.env.NODE_ENV === 'development' && pathname === '/dev/capture') ? <FamilyGate /> : !parentPage && locked ? <PlayTimeRest /> : <><div className="play-time-content" inert={!parentPage && expired}>{!parentPage && <PlayTimeNotice />}{children}</div></>}</main>
      <footer className="footer"><span>KANTO 151 <span className="footer-dot">·</span> 每一次成长，都有一个新伙伴</span><span>{snapshot.records.length} / 151 已相遇</span></footer>
    </div>
    <nav className="mobile-nav" aria-label="手机导航" inert={locked && !parentPage}>{links.map(({ href, name, icon: Icon }) => <Link key={href} href={href} className={pathname === href || (href === '/learn' && pathname.startsWith('/learn/')) || (href === '/pokedex' && pathname.startsWith('/pokemon/')) ? 'active' : ''}><Icon size={21} /><span>{name}</span></Link>)}</nav>
  </div>;
}
