'use client';
import { useLayoutEffect, useRef, useSyncExternalStore, type MouseEvent } from 'react';

type Page = 'home' | 'bag' | 'history';
type View = { y: number; href: string; index: number; offset: number };
const views: Partial<Record<Page, View>> = {};
let mapChapter: number | null = null;
const chapterListeners = new Set<() => void>();
const pageClass: Record<Page, string> = { home: 'adventure-page', bag: 'bag-page', history: 'history-page' };

export function rememberDetailDeparture(page: Page, event: MouseEvent<HTMLElement>) {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/pokemon/"]');
  if (!link) return;
  const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href^="/pokemon/"]')];
  views[page] = { y: window.scrollY, href: link.getAttribute('href') ?? '', index: links.indexOf(link), offset: link.getBoundingClientRect().top };
}

export function useReturnPosition(page: Page, ready: boolean) {
  const restored = useRef(false);
  useLayoutEffect(() => {
    if (!ready || restored.current) return;
    const view = views[page];
    if (!view) { restored.current = true; return; }
    const frame = requestAnimationFrame(() => {
      const links = [...document.querySelectorAll<HTMLAnchorElement>(`.${pageClass[page]} a[href^="/pokemon/"]`)];
      const anchor = links[view.index]?.getAttribute('href') === view.href ? links[view.index] : links.find(link => link.getAttribute('href') === view.href);
      window.scrollTo({ top: anchor ? anchor.getBoundingClientRect().top + window.scrollY - view.offset : view.y, behavior: 'instant' });
      delete views[page];
      restored.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [page, ready]);
}

export function rememberMapChapter(chapter: number | null) { mapChapter = chapter; chapterListeners.forEach(listener => listener()); }
export function rememberedMapChapter() { return mapChapter; }
function subscribeChapter(listener: () => void) { chapterListeners.add(listener); return () => { chapterListeners.delete(listener); }; }
function noChapter() { return null; }
export function useRememberedMapChapter() {
  return useSyncExternalStore(subscribeChapter, rememberedMapChapter, noChapter);
}
