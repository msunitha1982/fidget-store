import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';
import { unlock } from '../../lib/adminAuth';

export function AdminLogin({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (unlock(password)) onUnlock();
    else {
      setError('Wrong password. Try again.');
      setPassword('');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__top">
        <Link to="/" aria-label="Fidget Store, home" className="admin-login__logo">
          <Logo size={26} />
        </Link>
        <ThemeToggle />
      </div>
      <form className="admin-login__card" onSubmit={submit} noValidate>
        <span className="empty__icon">
          <Icon name="lock" size={26} />
        </span>
        <h1 className="admin-login__title">Admin dashboard</h1>
        <p className="muted">Enter the admin password to continue.</p>
        <div className="field">
          <label className="field__label" htmlFor="admin-pw">
            Password
          </label>
          <input
            id="admin-pw"
            className="input"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'admin-pw-err' : undefined}
          />
          {error && (
            <p className="field__error" id="admin-pw-err" role="alert">
              <Icon name="info" size={16} /> {error}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn--lg btn--block" disabled={!password}>
          Unlock
        </button>
        <Link to="/shop" className="link-btn">
          <Icon name="arrowLeft" size={18} /> Back to the shop
        </Link>
      </form>
    </div>
  );
}
