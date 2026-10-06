import { isPlaceholder } from '../config/site';

/** Renders config copy; unfilled "[...]" values get a visible placeholder style. */
export function ConfigText({ value }: { value: string }) {
  if (!isPlaceholder(value)) return <>{value}</>;
  return (
    <span className="ph" title="Placeholder — business detail not decided yet">
      {value}
    </span>
  );
}
