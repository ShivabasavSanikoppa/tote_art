import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useArt } from '../context/ArtContext';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css';

// Art gallery lifestyle/context images — shown on hover
const GALLERY_CONTEXT_IMAGES = [
  'https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544967082-d9d25d867d66?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop',
];

// Pick a stable context image based on product id
const getContextImage = (product) => {
  const idx = product.id
    ? Math.abs(product.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % GALLERY_CONTEXT_IMAGES.length
    : 0;
  return GALLERY_CONTEXT_IMAGES[idx];
};

const ProductCard = ({ product }) => {
  const { toggleFavorite, isFavorite } = useArt();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isFav = isFavorite(product.id);
  const [hovered, setHovered] = useState(false);
  const contextImage = getContextImage(product);

  return (
    <div
      className="product-card glass-panel animate-fade-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="card-image-container">
        {/* Primary artwork image — visible by default, hides on hover */}
        <img
          src={product.image}
          alt={product.title}
          className={`card-image card-image-primary${hovered ? ' card-image-fade-out' : ''}`}
        />
        {/* Secondary gallery context image — hidden by default, shows on hover */}
        <img
          src={contextImage}
          alt={`${product.title} in gallery`}
          className={`card-image card-image-secondary${hovered ? ' card-image-fade-in' : ''}`}
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

        {/* Image indicator dots */}
        <div className="card-image-dots">
          <span className={`dot${!hovered ? ' active' : ''}`} />
          <span className={`dot${hovered ? ' active' : ''}`} />
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
