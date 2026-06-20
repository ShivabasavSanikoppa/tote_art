import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useArt } from '../context/ArtContext';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { toggleFavorite, isFavorite } = useArt();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isFav = isFavorite(product.id);
  const isOutOfStock = product.quantity !== undefined && product.quantity === 0;

  return (
    <div className={`product-card glass-panel animate-fade-in${isOutOfStock ? ' out-of-stock-card' : ''}`}>
      <div className="card-image-container">
        <img
          src={product.image}
          alt={product.title}
          className="card-image"
          style={{ opacity: isOutOfStock ? 0.5 : 1 }}
        />

        {isOutOfStock && (
          <div className="out-of-stock-badge">Not Available</div>
        )}

        <button
          className={`favorite-btn ${isFav ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) {
              navigate('/login', { state: { from: location.pathname } });
              return;
            }
            toggleFavorite(product.id);
          }}
          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart size={16} fill={isFav ? 'var(--accent-gold)' : 'none'} color={isFav ? 'var(--accent-gold)' : '#fff'} />
        </button>

        {!isOutOfStock && (
          <div className="card-overlay">
            <Link to={`/product/${product.id}`} className="btn-primary view-btn">View Details</Link>
          </div>
        )}
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{product.title}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            {product.offerPrice > 0 && product.originalPrice > 0 ? (
              <>
                <span style={{ color: '#888', textDecoration: 'line-through', fontSize: '0.8rem' }}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="card-price" style={{ color: isOutOfStock ? '#aaa' : 'var(--accent-gold)' }}>
                  {isOutOfStock ? 'Unavailable' : `₹${product.offerPrice.toLocaleString('en-IN')}`}
                </span>
                {!isOutOfStock && (
                  <span style={{ color: '#27ae60', fontSize: '0.72rem', fontWeight: 'bold' }}>
                    {Math.round((1 - product.offerPrice / product.originalPrice) * 100)}% OFF
                  </span>
                )}
              </>
            ) : (
              <span className="card-price" style={{ color: isOutOfStock ? '#aaa' : 'var(--accent-gold)' }}>
                {isOutOfStock ? 'Unavailable' : `₹${product.price.toLocaleString('en-IN')}`}
              </span>
            )}
          </div>
        </div>
        <p className="card-artist">by {product.artist}</p>
        <p className="card-category">
          {product.subCategory ? `${product.category} · ${product.subCategory}` : product.category}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
