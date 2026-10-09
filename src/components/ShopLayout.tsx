import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { site } from '../config/site';
import { useCart } from '../lib/cart';
import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';

export function ScrollToTop() {
  const { pathname } = useLocation();
  // Block body on purpose: newer browsers return a Promise from scrollTo, and an effect
  // must never return anything but a cleanup function.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function ShopLayout() {
  const { count } = useCart();
  const { pathname } = useLocation();
  const inCheckout = pathname.startsWith('/order/details');
  // Product pages belong to the Shop tab.
  const inShop = pathname.startsWith('/shop') || pathname.startsWith('/products');

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
            <span className="site-nav">
              <Link to="/order" className="link-btn">
                <Icon name="arrowLeft" size={18} /> Back to your order
              </Link>
              <ThemeToggle />
            </span>
          ) : (
            <nav className="site-nav" aria-label="Main">
              <NavLink to="/" end className="site-nav__link">
                Home
              </NavLink>
              <NavLink to="/shop" className={() => `site-nav__link ${inShop ? 'active' : ''}`} aria-current={inShop ? 'page' : undefined}>
                Shop
              </NavLink>
              <ThemeToggle />
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
        <Link to="/admin" className="admin-link">
          Admin Dashboard
        </Link>
      </footer>
    </div>
  );
}
