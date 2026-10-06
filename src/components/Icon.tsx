// Stroke icons (24px grid). Decorative by default; pass `label` to make one meaningful.

const paths = {
  bag: 'M5 8h14l-1.2 12H6.2L5 8Z M9 8V6.5a3 3 0 0 1 6 0V8',
  cash: 'M4.5 6h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M12 9.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2Z M6 9.5v5 M18 9.5v5',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z M4 7.5l8 4.5 8-4.5 M12 12v9',
  rotateLeft: 'M3.5 12a8.5 8.5 0 1 0 2.8-6.3 M3.5 3.5v5h5',
  rotateRight: 'M20.5 12a8.5 8.5 0 1 1-2.8-6.3 M20.5 3.5v5h-5',
  zoomIn: 'M11 4a7 7 0 1 1 0 14a7 7 0 1 1 0-14Z M20 20l-4-4 M11 8v6 M8 11h6',
  zoomOut: 'M11 4a7 7 0 1 1 0 14a7 7 0 1 1 0-14Z M20 20l-4-4 M8 11h6',
  reset: 'M4 9V5h4 M20 9V5h-4 M4 15v4h4 M20 15v4h-4 M12 9.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 1 1 0-5Z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12 M18 6L6 18',
  arrowLeft: 'M19 12H5 M11 6l-6 6 6 6',
  arrowRight: 'M5 12h14 M13 6l6 6-6 6',
  trash: 'M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4Z',
  image: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M9 8a2 2 0 1 1 0 4a2 2 0 1 1 0-4Z M21 16l-5-5-9 9',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  alert: 'M12 3l10 18H2L12 3Z M12 10v5 M12 18v.01',
  info: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18Z M12 11v5.5 M12 7.5v.01',
  printer: 'M7 9V3h10v6 M5 9h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2 M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2 M7 14h10v7H7z',
  mail: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z M3 7l9 6 9-6',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  hand: 'M8 13V6a1.5 1.5 0 0 1 3 0v6 M11 11V4.5a1.5 1.5 0 0 1 3 0V11 M14 11V6a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7a6 6 0 0 1-5-3l-2.5-4.2a1.5 1.5 0 0 1 2.5-1.6L8 13',
  copy: 'M10 8h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3',
  chevronDown: 'M6 9l6 6 6-6',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z M12 9a3 3 0 1 1 0 6a3 3 0 1 1 0-6Z',
  eyeOff: 'M3 3l18 18 M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1 M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6 M9.9 9.9a3 3 0 0 0 4.2 4.2',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
} as const;

export type IconName = keyof typeof paths;

interface Props {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function Icon({ name, size = 20, strokeWidth = 1.8, label, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
