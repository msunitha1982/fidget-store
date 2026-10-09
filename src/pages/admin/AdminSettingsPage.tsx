import { useState, type FormEvent } from 'react';
import { Icon } from '../../components/Icon';
import { Alert } from '../../components/States';
import { changePassword, MIN_PASSWORD_LENGTH, type ChangeResult } from '../../lib/adminAuth';

type Fields = { current: string; next: string; confirm: string };
const EMPTY: Fields = { current: '', next: '', confirm: '' };

export function AdminSettingsPage() {
  const [form, setForm] = useState<Fields>(EMPTY);
  const [result, setResult] = useState<ChangeResult | null>(null);
  const error = result && !result.ok ? result : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = changePassword(form.current, form.next, form.confirm);
    setResult(r);
    if (r.ok) setForm(EMPTY);
  };

  const field = (key: keyof Fields, label: string, autoComplete: string, help?: string) => (
    <div className="field">
      <label className="field__label" htmlFor={`pw-${key}`}>
        {label}
      </label>
      <input
        id={`pw-${key}`}
        className="input"
        type="password"
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => {
          setForm({ ...form, [key]: e.target.value });
          setResult(null);
        }}
        aria-invalid={error?.field === key}
        aria-describedby={error?.field === key ? `pw-${key}-err` : undefined}
      />
      {error?.field === key ? (
        <p className="field__error" id={`pw-${key}-err`}>
          <Icon name="info" size={16} /> {error.message}
        </p>
      ) : (
        help && <p className="field__help">{help}</p>
      )}
    </div>
  );

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Settings</h1>
          <p className="muted">Change the password for this dashboard.</p>
        </div>
      </header>
      <form className="apanel settings-form" onSubmit={submit} noValidate>
        <h2 className="apanel__title">Admin password</h2>
        {result?.ok && <Alert tone="info" title="Password changed.">Use the new password next time you unlock the dashboard.</Alert>}
        {field('current', 'Current password', 'current-password')}
        {field('next', 'New password', 'new-password', `At least ${MIN_PASSWORD_LENGTH} characters.`)}
        {field('confirm', 'Repeat new password', 'new-password')}
        <button type="submit" className="btn" disabled={!form.current || !form.next || !form.confirm}>
          Change password
        </button>
        <p className="field__help">The password is saved in this browser. On another computer, the dashboard still uses the previous password.</p>
      </form>
    </div>
  );
}
