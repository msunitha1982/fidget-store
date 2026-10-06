// TEMPORARY procedural models, used until the owner's real STL files exist.
// Each shape returns one geometry per part id, so the viewer treats them exactly like
// multi-part STL uploads. Delete this file once every product uses `kind: 'stl'`.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PlaceholderShape } from '../types';

type PartGeometries = Record<string, THREE.BufferGeometry>;

const TAU = Math.PI * 2;

/** A star-shaped outline from a radius function r(θ), optionally with circular holes. */
function radialShape(r: (theta: number) => number, holes: { x: number; y: number; r: number }[] = [], samples = 360) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * TAU;
    const rad = r(t);
    const x = Math.cos(t) * rad;
    const y = Math.sin(t) * rad;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (const h of holes) {
    const path = new THREE.Path();
    path.absarc(h.x, h.y, h.r, 0, TAU, true);
    shape.holes.push(path);
  }
  return shape;
}

/** Outer edge of a union of circles, seen from the origin (works because the union is star-shaped). */
function circleUnion(circles: { x: number; y: number; r: number }[]) {
  return (t: number) => {
    const dx = Math.cos(t);
    const dy = Math.sin(t);
    let best = 0;
    for (const c of circles) {
      const b = dx * c.x + dy * c.y;
      const disc = b * b - (c.x * c.x + c.y * c.y) + c.r * c.r;
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    return best;
  };
}

/** Extrudes a 2D shape into a slab lying flat (thickness along Y), centred on y = 0. */
function slab(shape: THREE.Shape, thickness: number, bevel = 0.045) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 48,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -(thickness - bevel * 2) / 2, 0);
  return g;
}

/** A cylinder with softened edges, standing on Y. */
function puck(radius: number, height: number, round = Math.min(0.05, radius * 0.25, height * 0.3)) {
  const h = height / 2;
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, -h)];
  const corner = (cx: number, cy: number, from: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = from + (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector2(cx + Math.cos(a) * round, cy + Math.sin(a) * round));
    }
  };
  corner(radius - round, -h + round, -Math.PI / 2);
  corner(radius - round, h - round, 0);
  pts.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(pts, 64);
}

const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => g.translate(x, y, z);
const merge = (list: THREE.BufferGeometry[]) => mergeGeometries(list.map((g) => g.toNonIndexed()))!;

const lobes = (n: number, dist: number, offset = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * TAU;
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist };
  });

const builders: Record<PlaceholderShape, () => PartGeometries> = {
  'tri-spinner': () => {
    const centres = lobes(3, 0.82);
    const outline = circleUnion([{ x: 0, y: 0, r: 0.5 }, ...centres.map((c) => ({ ...c, r: 0.46 }))]);
    const body = slab(radialShape(outline, [{ x: 0, y: 0, r: 0.27 }, ...centres.map((c) => ({ ...c, r: 0.25 }))]), 0.26);
    const caps = merge([
      at(puck(0.32, 0.36), 0, 0, 0),
      // Shape coords (x, y) map to world (x, -z) after the slab rotation.
      ...centres.map((c) => at(puck(0.29, 0.34), c.x, 0, -c.y)),
    ]);
    return { body, caps };
  },

  'hex-nut': () => {
    const hex = (t: number) => {
      const seg = TAU / 6;
      const local = ((t % seg) + seg) % seg - seg / 2;
      return 0.86 * Math.cos(seg / 2) / Math.cos(local);
    };
    const nut = slab(radialShape(hex, [{ x: 0, y: 0, r: 0.43 }]), 0.5, 0.06);
    const head = slab(radialShape((t) => 0.62 * Math.cos(Math.PI / 6) / Math.cos((((t % (TAU / 6)) + TAU / 6) % (TAU / 6)) - Math.PI / 6)), 0.24, 0.04);
    const threads = Array.from({ length: 5 }, (_, i) => {
      const ring = new THREE.TorusGeometry(0.385, 0.025, 8, 48);
      ring.rotateX(Math.PI / 2);
      return at(ring, 0, 0.32 + i * 0.09, 0);
    });
    const bolt = merge([at(puck(0.38, 1.5), 0, -0.05, 0), at(head, 0, -0.92, 0), ...threads]);
    return { nut, bolt };
  },

  'click-cube': () => {
    const shell = new RoundedBoxGeometry(1.3, 1.3, 1.3, 5, 0.17);
    const buttons = merge([
      ...[
        [-0.3, -0.3],
        [0.3, -0.3],
        [-0.3, 0.3],
        [0.3, 0.3],
      ].map(([x, z]) => at(puck(0.2, 0.16), x, 0.68, z)),
      at(puck(0.27, 0.14).rotateX(Math.PI / 2), 0, 0, 0.68),
    ]);
    return { shell, buttons };
  },

  'bead-ring': () => {
    const ring = new THREE.TorusGeometry(0.95, 0.12, 32, 160).rotateX(Math.PI / 2);
    const beads = merge(lobes(8, 0.95, 0).map((c) => at(new THREE.SphereGeometry(0.25, 32, 24), c.x, 0, c.y)));
    return { ring, beads };
  },

  'gear-spinner': () => {
    const teeth = 12;
    const smooth = (e0: number, e1: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    };
    const outline = (t: number) => 0.8 + 0.16 * smooth(-0.35, 0.35, Math.sin(teeth * t));
    const gear = slab(radialShape(outline, [{ x: 0, y: 0, r: 0.33 }], 720), 0.26);
    const hub = merge([puck(0.36, 0.46), at(puck(0.18, 0.56), 0, 0, 0)]);
    return { gear, hub };
  },

  'ripple-disc': () => {
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0.17)];
    const R = 1.0;
    for (let i = 1; i <= 120; i++) {
      const r = (i / 120) * (R - 0.08);
      pts.push(new THREE.Vector2(r, 0.13 + 0.035 * Math.cos((r / R) * Math.PI * 7)));
    }
    // Rounded rim, then a flat underside.
    for (let i = 1; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector2(R - 0.08 + Math.sin(a) * 0.08, 0.06 + Math.cos(a) * 0.06));
    }
    pts.push(new THREE.Vector2(R, -0.08), new THREE.Vector2(R - 0.05, -0.13), new THREE.Vector2(0, -0.13));
    return { disc: new THREE.LatheGeometry(pts, 128) };
  },
};

/** Part ids each placeholder provides — the admin shows these as the model's parts. */
export const PLACEHOLDER_PARTS: Record<PlaceholderShape, { id: string; name: string }[]> = {
  'tri-spinner': [
    { id: 'body', name: 'Body' },
    { id: 'caps', name: 'Caps' },
  ],
  'hex-nut': [
    { id: 'nut', name: 'Nut' },
    { id: 'bolt', name: 'Bolt' },
  ],
  'click-cube': [
    { id: 'shell', name: 'Shell' },
    { id: 'buttons', name: 'Buttons' },
  ],
  'bead-ring': [
    { id: 'ring', name: 'Ring' },
    { id: 'beads', name: 'Beads' },
  ],
  'gear-spinner': [
    { id: 'gear', name: 'Gear' },
    { id: 'hub', name: 'Hub' },
  ],
  'ripple-disc': [{ id: 'disc', name: 'Disc' }],
};

export const PLACEHOLDER_LABELS: Record<PlaceholderShape, string> = {
  'tri-spinner': 'Tri spinner',
  'hex-nut': 'Hex nut',
  'click-cube': 'Click cube',
  'bead-ring': 'Bead ring',
  'gear-spinner': 'Gear spinner',
  'ripple-disc': 'Ripple disc',
};

export function buildPlaceholder(shape: PlaceholderShape): PartGeometries {
  return builders[shape]();
}
