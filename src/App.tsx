import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { ScrollToTop, ShopLayout } from './components/ShopLayout';
import { ToastProvider } from './components/Toast';
import { CartProvider } from './lib/cart';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOrderPage } from './pages/admin/AdminOrderPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProductEditorPage } from './pages/admin/AdminProductEditorPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CartPage } from './pages/shop/CartPage';
import { CheckoutPage } from './pages/shop/CheckoutPage';
import { ConfirmationPage } from './pages/shop/ConfirmationPage';
import { HomePage } from './pages/shop/HomePage';
import { ProductPage } from './pages/shop/ProductPage';

function Root() {
  return (
    <ToastProvider>
      <ScrollToTop />
      <Outlet />
    </ToastProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <ShopLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/products/:slug', element: <ProductPage /> },
          { path: '/order', element: <CartPage /> },
          { path: '/order/details', element: <CheckoutPage /> },
          { path: '/order/confirmed/:number', element: <ConfirmationPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/orders" replace /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'orders/:number', element: <AdminOrderPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'products/new', element: <AdminProductEditorPage /> },
          { path: 'products/:id', element: <AdminProductEditorPage /> },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </CartProvider>
  );
}
