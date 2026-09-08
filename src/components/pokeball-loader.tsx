export function PokeballLoader({ label = '正在翻开冒险手帐…' }: { label?: string }) {
  return (
    <div className="pokeball-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="pokeball" aria-hidden="true">
        <span className="pokeball-shine" />
        <span className="pokeball-button" />
      </div>
      <span className="pokeball-shadow" aria-hidden="true" />
      <span className="pokeball-label">{label}</span>
    </div>
  );
}
