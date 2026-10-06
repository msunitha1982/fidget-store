import { useEffect, useState } from 'react';
import { snapshot } from '../three/snapshot';
import type { ModelSource } from '../types';

interface Props {
  model: ModelSource | null;
  partColors: Record<string, string>;
  /** Alt text; omit when the thumbnail is decorative (e.g. next to the product name). */
  alt?: string;
  className?: string;
}

/** A still render of the model in the given colors, made by the shared snapshot renderer. */
export function ModelThumb({ model, partColors, alt = '', className = '' }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const colorsKey = JSON.stringify(partColors);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    if (!model) return;
    snapshot(model, partColors).then(
      (url) => alive && setSrc(url),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model ? JSON.stringify(model) : '', colorsKey]);

  const fallbackColors = [...new Set(Object.values(partColors))].slice(0, 3);
  return (
    <span className={`thumb plate ${className}`}>
      {src && !failed ? (
        <img src={src} alt={alt} draggable={false} />
      ) : failed || !model ? (
        <span className="thumb__fallback" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
          {fallbackColors.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
        </span>
      ) : (
        <span className="thumb__loading" aria-hidden="true" />
      )}
    </span>
  );
}
