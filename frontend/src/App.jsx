import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage              from './pages/HomePage.jsx';
import ShopPage              from './pages/ShopPage.jsx';
import ProductDetailPage     from './pages/ProductDetailPage.jsx';
import BasketPage            from './pages/BasketPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import AdminLogin            from './admin/AdminLogin.jsx';
import AdminDashboard        from './admin/AdminDashboard.jsx';

function RequireAdmin({ children }) {
  const token = localStorage.getItem('h8_admin_token');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"                element={<HomePage />} />
      <Route path="/shop"            element={<ShopPage />} />
      <Route path="/product/:id"     element={<ProductDetailPage />} />
      <Route path="/basket"          element={<BasketPage />} />
      <Route path="/order-confirmed" element={<OrderConfirmationPage />} />
      <Route path="/admin/login"     element={<AdminLogin />} />
      <Route path="/admin"           element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
      <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
  );
}
