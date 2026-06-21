import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { CartProvider } from './context/CartContext'
import { AuthProvider, TAB_TOKEN_KEY } from './context/AuthContext'
import { ArtProvider } from './context/ArtContext'
import { OrderProvider } from './context/OrderContext'
import App from './App.jsx'
import API_BASE from './api'
import './index.css'

// Wake up Render backend on load
fetch(`${API_BASE}/api/artworks`).catch(() => {});

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Inject Authorization header from tab-specific sessionStorage on every fetch
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  const token = sessionStorage.getItem(TAB_TOKEN_KEY);
  if (token) {
    if (!init.headers) {
      init.headers = {};
    }
    if (init.headers instanceof Headers) {
      if (!init.headers.has('Authorization') && !init.headers.has('authorization')) {
        init.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(init.headers)) {
      const hasAuth = init.headers.some(([key]) => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        init.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      if (!init.headers['Authorization'] && !init.headers['authorization']) {
        init.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ArtProvider>
          <OrderProvider>
            <CartProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </CartProvider>
          </OrderProvider>
        </ArtProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
