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

// Wake up Render backend on load
fetch(`${API_BASE}/api/artworks`).catch(() => {});

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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
