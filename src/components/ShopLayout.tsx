import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { site } from '../config/site';
import { useCart } from '../lib/cart';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { ConfigText } from './Placeholder';

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export function ShopLayout() {
  const { count } = useCart();
  const { pathname } = useLocation();
  const inCheckout = pathname.startsWith('/order/details');

  return (
    <div className="shop">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="site-header__home" aria-label={`${site.name}, home`}>
            <Logo />
          </Link>
          {inCheckout ? (
            <Link to="/order" className="link-btn">
              <Icon name="arrowLeft" size={18} /> Back to your order
            </Link>
          ) : (
            <nav className="site-nav" aria-label="Main">
              <NavLink to="/" end className="site-nav__link">
                Shop
              </NavLink>
              <Link to="/#how" className="site-nav__link site-nav__link--wide">
                How ordering works
              </Link>
              <NavLink to="/order" className="bag-btn" aria-label={`Your order, ${count} ${count === 1 ? 'item' : 'items'}`}>
                <Icon name="bag" size={20} />
                <span className="bag-btn__label">Order</span>
                <span className="bag-btn__count" key={count}>
                  {count}
                </span>
              </NavLink>
            </nav>
          )}
        </div>
      </header>
      <main id="main" className="shop__main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Logo size={22} />
          <span>
            Questions? <ConfigText value={site.contact} />
          </span>
          <span>
            © {new Date().getFullYear()} <ConfigText value={site.legalName} />
          </span>
          <Link to="/admin" className="site-footer__admin">
            Owner admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
