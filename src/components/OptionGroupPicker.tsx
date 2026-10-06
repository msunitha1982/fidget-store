import { isLight } from '../lib/color';
import type { OptionGroup, Product } from '../types';
import { Icon } from './Icon';

interface Props {
  product: Product;
  group: OptionGroup;
  value: string;
  onChange: (colorId: string) => void;
  /** Called with the group's part ids on hover/focus and null on leave — drives the viewer highlight. */
  onFocusParts?: (partIds: string[] | null) => void;
  size?: 'md' | 'sm';
}

/** One color choice ("Primary · Body") as a group of real radio buttons styled as chips. */
export function OptionGroupPicker({ product, group, value, onChange, onFocusParts, size = 'md' }: Props) {
  const parts = group.partIds.map((id) => product.parts.find((p) => p.id === id)?.name).filter(Boolean).join(' & ');
  const current = group.colors.find((c) => c.id === value) ?? group.colors[0];
  const headingId = `og-${product.id}-${group.id}`;
  const index = product.optionGroups.indexOf(group);

  return (
    <div
      className={`option-group option-group--${size}`}
      onMouseEnter={() => onFocusParts?.(group.partIds)}
      onMouseLeave={() => onFocusParts?.(null)}
      onFocus={() => onFocusParts?.(group.partIds)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onFocusParts?.(null);
      }}
    >
      <div className="option-group__head">
        <span className="option-group__title">
          <PartGlyph index={index} total={product.optionGroups.length} color={current?.hex} />
          <span id={headingId}>
            {group.label}
            {parts && <span className="option-group__parts"> · {parts}</span>}
          </span>
        </span>
        <span className="option-group__current mono" aria-hidden="true">
          {current?.name}
        </span>
      </div>
      <div className="option-group__chips" role="radiogroup" aria-labelledby={headingId}>
        {group.colors.map((c) => (
          <label key={c.id} className="chip">
            <input
              className="sr-only"
              type="radio"
              name={`${product.id}-${group.id}`}
              value={c.id}
              checked={c.id === value}
              onChange={() => onChange(c.id)}
            />
            <span className="chip__swatch" style={{ background: c.hex, color: isLight(c.hex) ? 'var(--ink)' : '#fff' }}>
              <Icon name="check" size={14} strokeWidth={3} className="chip__check" />
            </span>
            {c.name}
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Tiny diagram: concentric rings, one per option group, with this group's ring filled.
 * Makes "which selector colors which part" readable at a glance.
 */
export function PartGlyph({ index, total, color }: { index: number; total: number; color?: string }) {
  const rings = Math.max(1, total);
  return (
    <svg className="part-glyph" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {Array.from({ length: rings }, (_, i) => {
        const r = 14 - (i * 14) / (rings + 0.6);
        return <circle key={i} cx="16" cy="16" r={r} fill={i === index ? color ?? 'var(--ink)' : '#fff'} stroke="var(--ink)" strokeWidth="1.5" />;
      })}
    </svg>
  );
}
