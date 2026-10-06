import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from './api';

export type AsyncState<T> =
  | { status: 'loading'; data?: T; error?: undefined }
  | { status: 'ready'; data: T; error?: undefined }
  | { status: 'error'; data?: T; error: Error };

/**
 * Runs an async loader, re-running when `deps` change or when the mock API reports a data change.
 * Background refreshes keep the previous data visible instead of flashing a skeleton.
 */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    let alive = true;
    setState((s) => (s.data !== undefined ? s : { status: 'loading' }));
    loadRef.current().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error: Error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setTick((t) => t + 1);
  }, []);
  return { ...state, reload };
}
