import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useArt } from '../context/ArtContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../api';
import './ProductDetails.css';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { artworks, removeArtwork, toggleFavorite, isFavorite } = useArt();
  const { user } = useAuth();
  const product = artworks.find(a => a.id === productId);
  const isFav = isFavorite(productId);
  const [activeTab, setActiveTab] = useState('description');
  const { addToCart, toggleCart } = useCart();

  const [whatsappNumber, setWhatsappNumber] = useState('9019832399');

  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/whatsapp`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.whatsappNumber) {
            setWhatsappNumber(data.whatsappNumber);
          }
        }
      } catch (err) {
        console.error('Failed to fetch WhatsApp number:', err);
      }
    };
    fetchWhatsAppNumber();
  }, []);

  if (!product) {
    return <div className="container" style={{ paddingTop: '120px' }}>Product not found</div>;
  }

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    addToCart(product);
    toggleCart();
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    addToCart(product);
    navigate('/checkout');
  };

  const isOutOfStock = product.quantity === 0;

  return (
    <div className="product-details-page container">
      <div className="product-layout">
        <div className="product-image-section">
          <img src={product.image} alt={product.title} className="main-product-image" />
        </div>
        
        <div className="product-info-section glass-panel">
          <h1 className="product-title">{product.title}</h1>
          <p className="product-artist">by <span className="artist-name">{product.artist}</span></p>
          
          <div className="product-price-row">
            <span className="price">₹{product.price.toLocaleString('en-IN')}</span>
            {!isOutOfStock && product.quantity <= 3 && product.quantity > 0 && (
              <span style={{ fontSize: '0.8rem', color: '#f39c12', fontWeight: 'bold', marginLeft: '1rem' }}>
                Only {product.quantity} left!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {isOutOfStock ? (
              <div style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(231,76,60,0.08)',
                border: '1px solid rgba(231,76,60,0.3)',
                borderRadius: '6px',
                color: '#e74c3c',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '1rem',
                letterSpacing: '1px'
              }}>
                NOT AVAILABLE CURRENTLY
              </div>
            ) : (
              <>
                <button className="btn-primary buy-btn" style={{ marginBottom: 0, flex: 1 }} onClick={handleBuyNow}>Buy Now</button>
                <button className="btn-outline buy-btn" style={{ marginBottom: 0, flex: 1 }} onClick={handleAddToCart}>Add to Cart</button>
              </>
            )}
            <button 
              className={`btn-outline buy-btn ${isFav ? 'active' : ''}`}
              style={{ 
                marginBottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem',
                flex: 1,
                borderColor: isFav ? 'var(--accent-gold)' : 'var(--accent-gold)',
                backgroundColor: isFav ? 'rgba(212, 175, 55, 0.1)' : 'transparent'
              }} 
              onClick={() => {
                if (!user) {
                  navigate('/login', { state: { from: location.pathname } });
                  return;
                }
                toggleFavorite(product.id);
              }}
              title={isFav ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={18} fill={isFav ? "var(--accent-gold)" : "none"} color="var(--accent-gold)" />
              {isFav ? 'Favorited' : 'Favorite'}
            </button>
            {user && user.role === 'admin' && (
              <button 
                className="btn-outline" 
                style={{ marginBottom: 0, borderColor: '#e74c3c', color: '#e74c3c' }} 
                onClick={() => {
                  if(window.confirm('Are you sure you want to permanently delete this artwork?')) {
                    removeArtwork(product.id);
                    navigate(`/category/${product.category}`);
                  }
                }}
              >
                Delete Artwork
              </button>
            )}
          </div>

          <div className="payment-note-badge animate-fade-in" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(212, 175, 55, 0.05)',
            border: '1px dashed rgba(212, 175, 55, 0.3)',
            borderRadius: '6px',
            padding: '0.8rem 1rem',
            marginBottom: '2rem',
            fontSize: '0.85rem',
            color: 'var(--accent-gold)'
          }}>
            <span style={{ fontSize: '1.2rem' }}>💳</span>
            <span><strong>Payment Method:</strong> Only Online UPI is supported. After checkout, you will receive a direct WhatsApp link to message us at <strong>+91 {whatsappNumber}</strong> for the UPI QR code to complete your payment.</span>
          </div>

          <div className="product-tabs">
            <button 
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={`tab-btn ${activeTab === 'how-made' ? 'active' : ''}`}
              onClick={() => setActiveTab('how-made')}
            >
              How It's Made
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'description' && <p>{product.description}</p>}
            {activeTab === 'how-made' && <p>{product.howItsMade}</p>}
          </div>

          <div className="product-meta">
            <p><strong>Category:</strong> {product.category}</p>
            {product.subCategory && <p><strong>Style:</strong> {product.subCategory}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
