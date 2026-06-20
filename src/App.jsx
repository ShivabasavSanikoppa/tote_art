import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Category from './pages/Category';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import Favorites from './pages/Favorites';
import { useAuth } from './context/AuthContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProfileRedirect = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/user" replace />;
};

const App = () => {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <CartSidebar />
      <main style={{ paddingTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categoryId" element={<Category />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProfileRedirect />} />

          {/* Protected — any logged-in user */}
          <Route path="/checkout" element={
            <ProtectedRoute><Checkout /></ProtectedRoute>
          } />
          <Route path="/user" element={
            <ProtectedRoute><UserPage /></ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute><Favorites /></ProtectedRoute>
          } />

          {/* Protected — admin only */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default App;
