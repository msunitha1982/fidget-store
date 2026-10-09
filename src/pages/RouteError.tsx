import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';

/** Shown instead of React Router's developer screen when a page crashes. */
export function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);

  return (
    <div className="route-error">
      <a href="/" className="route-error__logo" aria-label="Fidget Store, home">
        <Logo />
      </a>
      <div className="empty empty--error route-error__box" role="alert">
        <span className="empty__icon">
          <Icon name="alert" size={28} />
        </span>
        <h1 className="empty__title">Something went wrong on this page</h1>
        <p className="empty__body">Your order is saved. Reload to try again, or head back to the shop.</p>
        <div className="route-error__actions">
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            <Icon name="refresh" size={18} /> Reload page
          </button>
          <a href="/shop" className="btn btn--outline">
            Go to the shop
          </a>
        </div>
        <details className="route-error__details">
          <summary>Technical details</summary>
          <code>{detail}</code>
        </details>
      </div>
    </div>
  );
}
