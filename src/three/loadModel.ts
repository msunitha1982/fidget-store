// Turns a ModelSource into normalised per-part geometry.
// This is the only place that knows where geometry comes from: placeholder shapes today,
// STL files (by URL or uploaded file id) as soon as they exist.

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { fileUrl } from '../lib/fileStore';
import type { ModelSource } from '../types';
import { buildPlaceholder } from './placeholders';

export interface LoadedPart {
  partId: string;
  geometry: THREE.BufferGeometry;
}

export interface LoadedModel {
  parts: LoadedPart[];
  /** Radius of the bounding sphere after normalising (used to frame the camera). */
  radius: number;
  /** Lowest point after normalising (used to place the shadow). */
  floorY: number;
}

/** Every model is scaled so its largest dimension is this many scene units. */
const TARGET_SIZE = 2.4;

export const modelKey = (source: ModelSource) => JSON.stringify(source);

const cache = new Map<string, Promise<LoadedModel>>();

/** Loads (and caches) a model. Geometries are shared — callers must not dispose them. */
export function loadModel(source: ModelSource): Promise<LoadedModel> {
  const key = modelKey(source);
  let p = cache.get(key);
  if (!p) {
    p = build(source);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

async function build(source: ModelSource): Promise<LoadedModel> {
  let parts: LoadedPart[];
  if (source.kind === 'placeholder') {
    parts = Object.entries(buildPlaceholder(source.shape)).map(([partId, geometry]) => ({ partId, geometry }));
  } else {
    if (source.files.length === 0) throw new Error('This model has no files yet.');
    const loader = new STLLoader();
    parts = await Promise.all(
      source.files.map(async (f) => {
        const url = f.url ?? (f.fileId ? await fileUrl(f.fileId) : null);
        if (!url) throw new Error(`Missing file for ${f.name}`);
        const geometry = await loader.loadAsync(url);
        if ((source.upAxis ?? 'z') === 'z') geometry.rotateX(-Math.PI / 2);
        if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
        return { partId: f.partId, geometry };
      }),
    );
  }
  return normalise(parts);
}

/** Centres all parts together and scales them to a consistent size, keeping their relative positions. */
function normalise(parts: LoadedPart[]): LoadedModel {
  const box = new THREE.Box3();
  for (const p of parts) {
    p.geometry.computeBoundingBox();
    box.union(p.geometry.boundingBox!);
  }
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const scale = TARGET_SIZE / Math.max(size.x, size.y, size.z, 1e-6);
  for (const p of parts) {
    p.geometry.translate(-centre.x, -centre.y, -centre.z);
    p.geometry.scale(scale, scale, scale);
    p.geometry.computeBoundingSphere();
  }
  return {
    parts,
    radius: (size.length() / 2) * scale,
    floorY: (-size.y / 2) * scale,
  };
}
