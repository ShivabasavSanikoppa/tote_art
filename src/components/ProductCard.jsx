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

  return (
    <div className="product-card glass-panel animate-fade-in">
      <div className="card-image-container">
        <img
          src={product.image}
          alt={product.title}
          className="card-image"
        />

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

        <div className="card-overlay">
          <Link to={`/product/${product.id}`} className="btn-primary view-btn">View Details</Link>
        </div>
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{product.title}</h3>
          <span className="card-price">₹{product.price.toLocaleString('en-IN')}</span>
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
