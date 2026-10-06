// Renders small still images of a model in given colors using ONE shared WebGL context.
// Used for cards, cart lines and admin lists, where dozens of live viewers would exhaust
// the browser's WebGL context limit. The product page uses the live ModelViewer instead.

import type * as THREE from 'three';
import type { ModelSource } from '../types';
import { loadModel, modelKey } from './loadModel';
import { createRenderer, createStage, type Stage } from './stage';

const SIZE = 480;
let renderer: THREE.WebGLRenderer | null = null;
let rendererFailed = false;
const stages = new Map<string, Promise<Stage>>();
const images = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();

function getRenderer() {
  if (rendererFailed) throw new Error('WebGL unavailable');
  if (!renderer) {
    try {
      renderer = createRenderer(undefined, { preserveDrawingBuffer: true });
      renderer.setPixelRatio(1);
      renderer.setSize(SIZE, SIZE, false);
    } catch (e) {
      rendererFailed = true;
      throw e;
    }
  }
  return renderer;
}

function stageFor(source: ModelSource) {
  const key = modelKey(source);
  let s = stages.get(key);
  if (!s) {
    s = loadModel(source).then((m) => {
      const stage = createStage(m);
      stage.camera.aspect = 1;
      stage.camera.position.multiplyScalar(0.94);
      stage.camera.updateProjectionMatrix();
      return stage;
    });
    s.catch(() => stages.delete(key));
    stages.set(key, s);
  }
  return s;
}

/** Returns a PNG data URL of the model in the given part colors (cached). */
export function snapshot(source: ModelSource, colors: Record<string, string>): Promise<string> {
  const key = modelKey(source) + '|' + JSON.stringify(colors);
  let p = images.get(key);
  if (!p) {
    // Renders are serialised: one shared canvas, one frame at a time.
    const job = queue.then(async () => {
      const stage = await stageFor(source);
      const r = getRenderer();
      stage.setColors(colors);
      stage.setHighlight(null);
      r.render(stage.scene, stage.camera);
      return r.domElement.toDataURL('image/png');
    });
    queue = job.catch(() => undefined);
    p = job;
    p.catch(() => images.delete(key));
    images.set(key, p);
  }
  return p;
}
