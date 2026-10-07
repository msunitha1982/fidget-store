import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadModel, modelKey } from '../three/loadModel';
import { createRenderer, createStage, type Stage } from '../three/stage';
import type { ModelSource } from '../types';
import { Icon } from './Icon';

export interface ModelViewerProps {
  model: ModelSource | null;
  /** partId -> hex. Changes apply instantly, without reloading the model. */
  partColors: Record<string, string>;
  /** Parts to emphasise (others are dimmed). null/undefined = show everything. */
  highlightPartIds?: string[] | null;
  /** Accessible name, e.g. the product name. */
  label: string;
  autoRotate?: boolean;
  /** Smaller controls for tight spaces (mobile, admin preview). */
  compact?: boolean;
  /** Overlays rendered on top of the canvas (e.g. a part legend). */
  children?: ReactNode;
  className?: string;
}

type Status = 'empty' | 'loading' | 'ready' | 'error' | 'unsupported';

interface Controller {
  rotate(dAzimuth: number, dPolar?: number): void;
  zoom(factor: number): void;
  reset(): void;
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Live WebGL product preview: orbit, zoom, reset, real-time part colors.
 * Geometry comes from `loadModel`, so placeholder shapes and real STL files behave the same.
 */
export function ModelViewer({ model, partColors, highlightPartIds, label, autoRotate = true, compact = false, children, className }: ModelViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const ctrlRef = useRef<Controller | null>(null);
  const colorsRef = useRef(partColors);
  const highlightRef = useRef(highlightPartIds ?? null);
  const [status, setStatus] = useState<Status>(model ? 'loading' : 'empty');
  const [error, setError] = useState('');
  const [interacted, setInteracted] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);
  const [attempt, setAttempt] = useState(0);
  const key = model ? modelKey(model) : '';

  colorsRef.current = partColors;
  highlightRef.current = highlightPartIds ?? null;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !model) {
      setStatus('empty');
      return;
    }
    setStatus('loading');
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = createRenderer();
    } catch {
      setStatus('unsupported');
      return;
    }
    const canvas = renderer.domElement;
    canvas.className = 'viewer__canvas';
    host.prepend(canvas);

    let controls: OrbitControls | null = null;
    let stage: Stage | null = null;
    let visible = true;
    const pending = { azimuth: 0, polar: 0, dolly: 1 };
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      if (stage) {
        stage.camera.aspect = w / h;
        stage.camera.updateProjectionMatrix();
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const loop = () => {
      if (!stage || !controls) return;
      const cam = stage.camera;
      const offset = cam.position.clone().sub(controls.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      if (Math.abs(pending.azimuth) > 1e-4 || Math.abs(pending.polar) > 1e-4) {
        const a = pending.azimuth * 0.16;
        const p = pending.polar * 0.16;
        pending.azimuth -= a;
        pending.polar -= p;
        sph.theta += a;
        sph.phi = THREE.MathUtils.clamp(sph.phi + p, controls.minPolarAngle, controls.maxPolarAngle);
      }
      if (Math.abs(pending.dolly - 1) > 1e-4) {
        const f = Math.pow(pending.dolly, 0.16);
        pending.dolly /= f;
        sph.radius = THREE.MathUtils.clamp(sph.radius * f, controls.minDistance, controls.maxDistance);
      }
      cam.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
      controls.update();
      renderer.render(stage.scene, cam);
    };
    const setRunning = (run: boolean) => renderer.setAnimationLoop(run && visible ? loop : null);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      setRunning(true);
    });
    io.observe(host);

    loadModel(model).then(
      (loaded) => {
        if (disposed) return;
        stage = createStage(loaded);
        stage.setColors(colorsRef.current);
        stage.setHighlight(highlightRef.current);
        stageRef.current = stage;
        const fit = stage.fitDistance;
        const c = new OrbitControls(stage.camera, canvas);
        controls = c;
        c.enableDamping = true;
        c.dampingFactor = 0.08;
        c.enablePan = false;
        c.rotateSpeed = 0.85;
        c.zoomSpeed = 0.8;
        c.minDistance = fit * 0.5;
        c.maxDistance = fit * 1.7;
        c.minPolarAngle = 0.12;
        c.maxPolarAngle = Math.PI - 0.12;
        c.autoRotate = autoRotate && !prefersReducedMotion();
        c.autoRotateSpeed = 1.6;
        c.saveState();
        const report = () => setZoomPct(Math.round((fit / stage!.camera.position.distanceTo(c.target)) * 100));
        c.addEventListener('change', report);
        c.addEventListener('start', () => {
          c.autoRotate = false;
          setInteracted(true);
        });
        ctrlRef.current = {
          rotate(dA, dP = 0) {
            c.autoRotate = false;
            setInteracted(true);
            pending.azimuth += dA;
            pending.polar += dP;
          },
          zoom(factor) {
            c.autoRotate = false;
            setInteracted(true);
            pending.dolly *= factor;
          },
          reset() {
            pending.azimuth = pending.polar = 0;
            pending.dolly = 1;
            c.reset();
            report();
          },
        };
        resize();
        setRunning(true);
        setStatus('ready');
      },
      (e: Error) => {
        if (disposed) return;
        setError(e.message || 'The model file could not be read.');
        setStatus('error');
      },
    );

    const onLost = (e: Event) => {
      e.preventDefault();
      setStatus('unsupported');
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      disposed = true;
      setRunning(false);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      controls?.dispose();
      stage?.dispose();
      stageRef.current = null;
      ctrlRef.current = null;
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
    // The model is identified by its key; colors/highlight update separately below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  useEffect(() => {
    stageRef.current?.setColors(partColors);
  }, [partColors]);
  useEffect(() => {
    stageRef.current?.setHighlight(highlightPartIds ?? null);
  }, [highlightPartIds]);

  const ctrl = (fn: (c: Controller) => void) => () => ctrlRef.current && fn(ctrlRef.current);
  const STEP = Math.PI / 6;

  const onKeyDown = (e: KeyboardEvent) => {
    const c = ctrlRef.current;
    if (!c) return;
    const map: Record<string, () => void> = {
      ArrowLeft: () => c.rotate(-STEP / 2),
      ArrowRight: () => c.rotate(STEP / 2),
      ArrowUp: () => c.rotate(0, -0.2),
      ArrowDown: () => c.rotate(0, 0.2),
      '+': () => c.zoom(0.85),
      '=': () => c.zoom(0.85),
      '-': () => c.zoom(1 / 0.85),
      '0': () => c.reset(),
      Home: () => c.reset(),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const ready = status === 'ready';

  return (
    <div className={`viewer plate ${compact ? 'viewer--compact' : ''} ${className ?? ''}`}>
      <div
        ref={hostRef}
        className="viewer__stage"
        tabIndex={ready ? 0 : -1}
        role="group"
        aria-roledescription="3D viewer"
        aria-label={`3D preview of ${label}. Drag or use the arrow keys to rotate, plus and minus to zoom, 0 to reset.`}
        onKeyDown={onKeyDown}
      />

      <div className="viewer__badges">
        <span className="viewer__badge">
          <span className="viewer__live" aria-hidden="true" />
          Live 3D
        </span>
        {model?.kind === 'placeholder' && (
          <span className="viewer__badge viewer__badge--temp" title="Temporary model — replaced when the real STL files are uploaded">
            Placeholder model
          </span>
        )}
      </div>

      {children && ready && <div className="viewer__overlay">{children}</div>}

      {status === 'loading' && (
        <div className="viewer__state" role="status">
          <LayerLoader />
          <span>Loading 3D preview…</span>
        </div>
      )}
      {status === 'empty' && (
        <div className="viewer__state">
          <Icon name="cube" size={36} strokeWidth={1.4} />
          <span>No 3D model yet.</span>
        </div>
      )}
      {(status === 'error' || status === 'unsupported') && (
        <div className="viewer__state" role="alert">
          <span className="viewer__state-icon">
            <Icon name="alert" size={26} />
          </span>
          <strong>{status === 'error' ? "The 3D preview didn't load" : "3D preview isn't available on this device"}</strong>
          <span className="viewer__state-sub">
            {status === 'error' ? error : 'You can still pick colors and order — they will be used for printing.'}
          </span>
          {status === 'error' && (
            <button type="button" className="btn btn--sm" onClick={() => setAttempt((a) => a + 1)}>
              <Icon name="refresh" size={18} /> Try again
            </button>
          )}
        </div>
      )}

      {ready && !interacted && !compact && (
        <div className="viewer__hint" aria-hidden="true">
          <Icon name="hand" size={18} strokeWidth={1.6} /> Drag to rotate · scroll to zoom
        </div>
      )}

      {ready && (
        <div className="viewer__toolbar" role="toolbar" aria-label="3D view controls">
          {!compact && (
            <>
              <button type="button" className="tool" aria-label="Rotate left" title="Rotate left" onClick={ctrl((c) => c.rotate(-STEP))}>
                <Icon name="rotateLeft" />
              </button>
              <button type="button" className="tool" aria-label="Rotate right" title="Rotate right" onClick={ctrl((c) => c.rotate(STEP))}>
                <Icon name="rotateRight" />
              </button>
              <span className="tool-sep" aria-hidden="true" />
            </>
          )}
          <button type="button" className="tool" aria-label="Zoom out" title="Zoom out" onClick={ctrl((c) => c.zoom(1 / 0.8))}>
            <Icon name="zoomOut" />
          </button>
          {!compact && (
            <span className="tool-readout" aria-live="polite">
              {zoomPct}%
            </span>
          )}
          <button type="button" className="tool" aria-label="Zoom in" title="Zoom in" onClick={ctrl((c) => c.zoom(0.8))}>
            <Icon name="zoomIn" />
          </button>
          <span className="tool-sep" aria-hidden="true" />
          <button type="button" className="tool tool--wide" onClick={ctrl((c) => c.reset())} aria-label="Reset view">
            <Icon name="reset" />
            {!compact && <span>Reset view</span>}
          </button>
        </div>
      )}
    </div>
  );
}

/** Loading indicator: a model "printing" layer by layer. */
export function LayerLoader() {
  return (
    <span className="layer-loader" aria-hidden="true">
      {[56, 80, 96, 104, 100, 88, 64].map((w, i) => (
        <span key={i} style={{ width: w, animationDelay: `${(6 - i) * 0.12}s` }} />
      ))}
    </span>
  );
}
