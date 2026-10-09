import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Logo } from '../../components/Logo';
import { adminListOrders, resetDemoData } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';

export function AdminLayout() {
  const orders = useAsync(adminListOrders, []);
  const newCount = orders.data?.filter((o) => o.status === 'NEW').length ?? 0;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="admin">
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>
      <aside className="admin-side">
        <Link to="/admin" className="admin-side__brand" aria-label="Admin home">
          <Logo size={26} />
          <span className="admin-side__tag mono">Admin</span>
        </Link>
        <nav className="admin-nav" aria-label="Admin">
          <NavLink to="/admin/orders" className="admin-nav__link">
            <Icon name="printer" /> Orders
            {newCount > 0 && <span className="admin-nav__badge">{newCount} new</span>}
          </NavLink>
          <NavLink to="/admin/products" className="admin-nav__link">
            <Icon name="cube" /> Products
          </NavLink>
        </nav>
        <div className="admin-side__foot">
          <Link to="/" className="admin-nav__link">
            <Icon name="external" /> View shop
          </Link>
          <div className="admin-side__proto">
            <strong>Prototype</strong>
            <span>No sign-in yet. Data is stored in this browser only.</span>
            {confirmReset ? (
              <span className="admin-side__confirm">
                <button
                  type="button"
                  className="link-btn link-btn--light"
                  onClick={async () => {
                    await resetDemoData();
                    setConfirmReset(false);
                  }}
                >
                  Yes, reset
                </button>
                <button type="button" className="link-btn link-btn--light" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" className="link-btn link-btn--light" onClick={() => setConfirmReset(true)}>
                <Icon name="refresh" size={16} /> Reset demo data
              </button>
            )}
          </div>
        </div>
      </aside>
      <main id="admin-main" className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
