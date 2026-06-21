import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { ArtProvider } from './context/ArtContext'
import { OrderProvider } from './context/OrderContext'
import App from './App.jsx'
import API_BASE from './api'
import './index.css'

// Generate a unique ID for this browser tab and store it in sessionStorage
// This ensures each tab has its own isolated auth token
if (!sessionStorage.getItem('_tab_id')) {
  sessionStorage.setItem('_tab_id', `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
}
export const TAB_TOKEN_KEY = `tote_token_${sessionStorage.getItem('_tab_id')}`;

// Wake up Render backend on load
fetch(`${API_BASE}/api/artworks`).catch(() => {});

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Inject Authorization header from tab-specific sessionStorage on every fetch
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  const token = sessionStorage.getItem(TAB_TOKEN_KEY);
  if (token) {
    init.headers = init.headers || {};
    if (!(init.headers instanceof Headers) && !Array.isArray(init.headers)) {
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
