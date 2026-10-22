import {createHash} from 'node:crypto';

export const exportSections = ['reward_codes','inventory','receipts','pokemon_collection','story_progress','legendary_progress','team','move_presets','learning','play_time','devices','device_play_time'] as const;
export type ExportData = Record<string, unknown>;
/** Stable key order makes checksums independent of JSON pretty-printing and object key order. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value !== null && typeof value === 'object') {
    return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>JSON.stringify(key)+':'+canonical(item)).join(',')+'}';
  }
  return JSON.stringify(value);
}
function digest(value: unknown) { return createHash('sha256').update(canonical(value)).digest('hex'); }
export function createFamilyExport(data: ExportData, exportedAt = new Date().toISOString()) {
  if (!data.family || !data.child || exportSections.some(key=>!Array.isArray(data[key]))) throw new Error('Incomplete family export');
  const counts=Object.fromEntries(exportSections.map(key=>[key,(data[key] as unknown[]).length]));
  const payload={format:'kanto-family-export',version:1,exportedAt,scope:'server-saved-data',counts,data};
  return {...payload,sha256:digest(payload)};
}
export function verifyFamilyExport(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Invalid export');
  const {sha256,...payload}=value as ReturnType<typeof createFamilyExport>;
  if(payload.format!=='kanto-family-export'||payload.version!==1||typeof sha256!=='string') throw new Error('Unsupported export format');
  if(digest(payload)!==sha256) throw new Error('Export checksum mismatch');
  const expected=createFamilyExport(payload.data,payload.exportedAt);
  if(canonical(expected.counts)!==canonical(payload.counts)) throw new Error('Export record counts mismatch');
  return expected;
}
