import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

interface ToastData {
  id: number;
  message: string;
  action?: { label: string; to: string };
}

const ToastContext = createContext<(t: Omit<ToastData, 'id'>) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<number>();
  const show = useCallback((t: Omit<ToastData, 'id'>) => {
    window.clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id}>
            <span className="toast__check">
              <Icon name="check" size={16} strokeWidth={2.8} />
            </span>
            <span className="toast__msg">{toast.message}</span>
            {toast.action && (
              <Link className="toast__action" to={toast.action.to} onClick={() => setToast(null)}>
                {toast.action.label}
              </Link>
            )}
            <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => setToast(null)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
