import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, User, LogOut, Heart, X, Home } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useArt } from '../context/ArtContext';
import './Navbar.css';

const Navbar = () => {
  const { cartItems, cartCount, toggleCart } = useCart();
  const { user, logout } = useAuth();
  const { favorites } = useArt();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname === '/admin';
  const hideCart = isLoginPage || isAdminPage;

  return (
    <>
      <nav className="navbar glass-panel">
        <div className="navbar-container container">
          <div className="navbar-left">
            <button className="action-btn menu-toggle-btn" onClick={() => setIsMenuOpen(true)} title="Open Menu">
              <Menu size={22} />
            </button>
            <div className="navbar-logo">
              <Link to="/">TOTE ART GALLERY</Link>
            </div>
          </div>
          
          <div className="navbar-links">
            {/* Category links removed as per user request, replaced by Explore boxes */}
          </div>

          <div className="navbar-actions">
            {!hideCart && (
              <button 
                className="action-btn cart-icon-btn" 
                onClick={() => {
                  if (!user) {
                    navigate('/login', { state: { from: location.pathname } });
                    return;
                  }
                  toggleCart();
                }} 
                title="Cart"
              >
                <ShoppingBag size={22} />
                {user && cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </button>
            )}

            {!isLoginPage && (
              <button 
                className="action-btn" 
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  if (user.role === 'admin') {
                    navigate('/admin');
                  } else {
                    navigate('/profile');
                  }
                }} 
                title={user ? "My Profile" : "Login / Register"}
              >
                <User size={22} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Collapsible Sidebar Menu Drawer */}
      <div className={`nav-drawer-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`nav-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <button className="close-drawer-btn" onClick={() => setIsMenuOpen(false)} title="Close Menu">
            <X size={24} />
          </button>
        </div>
        <div className="drawer-content">
          {user ? (
            <div className="drawer-user-info">
              <div className="drawer-user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="drawer-username">Hi, {user.name}</span>
            </div>
          ) : null}
          
          <nav className="drawer-nav-list">
            <Link to="/" className="drawer-nav-item" onClick={() => setIsMenuOpen(false)}>
              <Home size={18} />
              <span>Home</span>
            </Link>

            {user ? (
              <Link to="/profile" className="drawer-nav-item" onClick={() => setIsMenuOpen(false)}>
                <User size={18} />
                <span>My Profile</span>
              </Link>
            ) : (
              <Link to="/login" className="drawer-nav-item" onClick={() => setIsMenuOpen(false)}>
                <User size={18} />
                <span>Login / Register</span>
              </Link>
            )}
            
            <Link to="/favorites" className="drawer-nav-item" onClick={() => setIsMenuOpen(false)}>
              <Heart size={18} />
              <span>Favourites</span>
            </Link>
            
            {user && (
              <button className="drawer-nav-item logout-drawer-btn" onClick={() => { logout(); setIsMenuOpen(false); }}>
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;
