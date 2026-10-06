// Scene setup shared by the interactive viewer and the thumbnail renderer,
// so a product looks identical everywhere.

import * as THREE from 'three';
import type { LoadedModel } from './loadModel';

export const DEFAULT_VIEW = {
  /** Camera direction, relative to the model centre. */
  direction: new THREE.Vector3(0.55, 0.62, 1).normalize(),
  distanceFactor: 3.5,
};

export interface Stage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  setColors(colors: Record<string, string>): void;
  /** Dims every part except these (null = show all normally). */
  setHighlight(partIds: string[] | null): void;
  /** Distance that frames the whole model. */
  fitDistance: number;
  dispose(): void;
}

const FALLBACK = '#B8BCC4';

export function createStage(model: LoadedModel): Stage {
  const scene = new THREE.Scene();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9ea3ad, 1.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  const s = model.radius * 1.6;
  Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.1, far: 30 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.7);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = model.floorY - 0.002;
  floor.receiveShadow = true;
  scene.add(floor);

  const meshes = model.parts.map(({ partId, geometry }) => {
    const material = new THREE.MeshPhysicalMaterial({
      color: FALLBACK,
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.25,
      clearcoatRoughness: 0.5,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.partId = partId;
    scene.add(mesh);
    return mesh;
  });

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  const fitDistance = model.radius * DEFAULT_VIEW.distanceFactor;
  camera.position.copy(DEFAULT_VIEW.direction).multiplyScalar(fitDistance);
  camera.lookAt(0, 0, 0);

  return {
    scene,
    camera,
    fitDistance,
    setColors(colors) {
      for (const m of meshes) (m.material as THREE.MeshPhysicalMaterial).color.set(colors[m.userData.partId] ?? FALLBACK);
    },
    setHighlight(partIds) {
      for (const m of meshes) {
        const mat = m.material as THREE.MeshPhysicalMaterial;
        const dim = partIds !== null && !partIds.includes(m.userData.partId);
        mat.opacity = dim ? 0.14 : 1;
        mat.depthWrite = !dim;
        m.castShadow = !dim;
      }
    },
    dispose() {
      for (const m of meshes) (m.material as THREE.Material).dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
    },
  };
}

export function createRenderer(canvas?: HTMLCanvasElement, opts: { preserveDrawingBuffer?: boolean } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: opts.preserveDrawingBuffer ?? false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}
