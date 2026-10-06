import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyProps {
  icon?: IconName;
  art?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'error';
}

export function EmptyState({ icon = 'cube', art, title, children, action, tone = 'neutral' }: EmptyProps) {
  return (
    <div className={`empty empty--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {art ?? (
        <span className="empty__icon">
          <Icon name={icon} size={28} strokeWidth={1.6} />
        </span>
      )}
      <h2 className="empty__title">{title}</h2>
      {children && <div className="empty__body">{children}</div>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="alert"
      tone="error"
      title={title}
      action={
        onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            <Icon name="refresh" size={18} /> Try again
          </button>
        )
      }
    >
      {message ?? 'Please check your connection and try again.'}
    </EmptyState>
  );
}

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function Alert({ tone = 'error', title, children }: { tone?: 'error' | 'warning' | 'info'; title?: string; children?: ReactNode }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={tone === 'info' ? 'info' : 'alert'} size={20} />
      <div>
        {title && <strong className="alert__title">{title}</strong>}
        {children && <div className="alert__body">{children}</div>}
      </div>
    </div>
  );
}
