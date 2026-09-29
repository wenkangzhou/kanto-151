export interface PlayTime {
  enabled: boolean;
  minutes: number;
  expiresAt: string | null;
  revision: number;
  serverNow: string;
  usageDay?: string;
}
export function usageDay(now: number) {
  return new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export function dailyDeadline(now: number, minutes: number) {
  const midnight = Date.parse(`${usageDay(now)}T00:00:00+08:00`) + 86_400_000;
  return new Date(Math.min(now + minutes * 60_000, midnight)).toISOString();
}
export type PlayTimeAction = 'start' | 'lock' | 'disable' | 'configure';
export function validMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 120;
}
export function playTimeLocked(time: PlayTime, now = Date.parse(time.serverNow)) {
  return time.enabled && (!time.expiresAt || Date.parse(time.expiresAt) <= now);
}
export function remainingSeconds(time: PlayTime, now: number) {
  return time.enabled && time.expiresAt ? Math.max(0, Math.ceil((Date.parse(time.expiresAt) - now) / 1000)) : 0;
}
export function timeLabel(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
