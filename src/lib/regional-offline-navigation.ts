import type { MouseEvent } from 'react';

export function openRegionalPageOffline(event: MouseEvent<HTMLElement>) {
  if (navigator.onLine || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/johto/pokedex"], a[href^="/hoenn/pokedex"]');
  if (!link) return;
  event.preventDefault();
  event.stopPropagation();
  window.location.assign(link.href);
}
