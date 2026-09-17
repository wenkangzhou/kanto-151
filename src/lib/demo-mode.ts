// Tab-local opt-in. Demo failures must never fall through to the real API.
const key = 'kanto-visitor-demo-v1';
let active = false;
export function isVisitorDemo() {
  if (typeof window === 'undefined') return false;
  if (active || window.location.pathname === '/demo') return true;
  try { active = sessionStorage.getItem(key) === 'on'; } catch { /* no opt-in */ }
  return active;
}
export function enterVisitorDemo() {
  sessionStorage.setItem(key, 'on');
  active = true;
}
export function exitVisitorDemo() {
  sessionStorage.removeItem(key);
  active = false;
  window.location.replace(new URL('/', window.location.origin).href);
}
