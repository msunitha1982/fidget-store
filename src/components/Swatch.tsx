export function Swatch({ hex, size = 16, className = '' }: { hex: string; size?: number; className?: string }) {
  return <span className={`swatch ${className}`} style={{ background: hex, width: size, height: size }} aria-hidden="true" />;
}

/** "● Body: Blue" chips, used in cart, confirmation and admin. */
export function ChoiceList({ choices, compact = false }: { choices: { groupLabel: string; partNames: string[]; colorName: string; hex: string }[]; compact?: boolean }) {
  return (
    <ul className={`choices ${compact ? 'choices--compact' : ''}`}>
      {choices.map((c) => (
        <li key={c.groupLabel}>
          <Swatch hex={c.hex} size={compact ? 12 : 16} />
          <span>
            {c.partNames.length ? c.partNames.join(' & ') : c.groupLabel}: <strong>{c.colorName}</strong>
          </span>
        </li>
      ))}
    </ul>
  );
}
