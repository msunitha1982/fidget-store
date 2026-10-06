import { site } from '../config/site';

/** Stacked "print layers" mark + wordmark. */
export function LogoMark({ size = 30, inverted = false }: { size?: number; inverted?: boolean }) {
  const ink = inverted ? '#fff' : 'var(--ink)';
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <rect x="5" y="4" width="20" height="6" rx="3" fill="var(--accent)" />
      <rect x="2" y="12" width="26" height="6" rx="3" fill={ink} />
      <rect x="5" y="20" width="20" height="6" rx="3" fill={ink} />
    </svg>
  );
}

export function Logo({ size = 30, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <span className="logo">
      <LogoMark size={size} inverted={inverted} />
      <span className="logo__word">{site.wordmark}</span>
    </span>
  );
}
