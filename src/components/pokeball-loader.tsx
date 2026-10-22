'use client';
import { useT } from '@/lib/i18n/locale';
export function PokeballLoader({ label = '正在翻开冒险手帐…' }: { label?: string }) {
  const localize = useT();
  return (
    <div className="pokeball-loader" role="status" aria-live="polite" aria-label={localize(label)}>
      <div className="pokeball" aria-hidden="true">
        <span className="pokeball-shine" />
        <span className="pokeball-button" />
      </div>
      <span className="pokeball-shadow" aria-hidden="true" />
      <span className="pokeball-label">{localize(label)}</span>
    </div>
  );
}
