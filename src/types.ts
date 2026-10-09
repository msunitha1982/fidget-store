// Domain types shared by the shop, the admin and the mock API.
// Money is always stored in integer cents.

export type Cents = number;

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

/** A piece of the 3D model that can be colored on its own (e.g. "Body", "Caps"). */
export interface ModelPart {
  id: string;
  name: string;
}

/**
 * One color choice the customer makes (e.g. "Primary").
 * It colors one or more model parts, so the UI never depends on how the model files are split.
 */
export interface OptionGroup {
  id: string;
  label: string;
  partIds: string[];
  colors: ColorOption[];
}

export type PlaceholderShape = 'tri-spinner' | 'hex-nut' | 'click-cube' | 'bead-ring' | 'gear-spinner' | 'ripple-disc';

/** Where a product's 3D geometry comes from. Swap `placeholder` for `stl` once real files exist. */
export type ModelSource =
  | { kind: 'placeholder'; shape: PlaceholderShape }
  | {
      kind: 'stl';
      /** STL files are usually Z-up; the viewer rotates them to Y-up. */
      upAxis?: 'y' | 'z';
      files: StlFile[];
    };

export interface StlFile {
  partId: string;
  /** Original file name, shown in the admin. */
  name: string;
  /** Either a URL (real backend / static file) or an id in the browser file store (prototype uploads). */
  url?: string;
  fileId?: string;
  sizeBytes?: number;
}

export interface ProductImage {
  id: string;
  alt: string;
  url?: string;
  fileId?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: Cents;
  description: string;
  images: ProductImage[];
  model: ModelSource | null;
  parts: ModelPart[];
  optionGroups: OptionGroup[];
  published: boolean;
  updatedAt: string;
}

/** groupId -> colorId */
export type Selections = Record<string, string>;

export interface CartLine {
  lineId: string;
  productId: string;
  quantity: number;
  selections: Selections;
}

export const ORDER_STATUSES = ['NEW', 'PRINTING', 'READY', 'COMPLETED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** A snapshot of what was chosen, so orders survive later product edits. */
export interface OrderChoice {
  groupLabel: string;
  partNames: string[];
  colorName: string;
  hex: string;
}

export interface OrderLine {
  productId: string;
  productName: string;
  unitPrice: Cents;
  quantity: number;
  choices: OrderChoice[];
  /** Kept so thumbnails can render the exact colors. */
  model: ModelSource | null;
  partColors: Record<string, string>;
}

export interface CustomerInfo {
  name: string;
  email: string;
  note: string;
}

export interface StatusChange {
  status: OrderStatus;
  at: string;
}

export interface Order {
  number: number;
  createdAt: string;
  status: OrderStatus;
  customer: CustomerInfo;
  lines: OrderLine[];
  total: Cents;
  history: StatusChange[];
  ownerNotifiedAt: string | null;
  /** Why the owner email failed, if it did (the admin can resend). */
  notifyError?: string | null;
}
