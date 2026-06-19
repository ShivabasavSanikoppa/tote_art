import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useArt } from '../context/ArtContext';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css';

// Curated second lifestyle images per category
const SECOND_IMAGES = {
  paintings: [
    'https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544967082-d9d25d867d66?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop',
  ],
  sketch: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=800&auto=format&fit=crop',
  ],
};

// Pick a stable second image based on product id
const getSecondImage = (product) => {
  const pool = SECOND_IMAGES[product.category] || SECOND_IMAGES.paintings;
  const idx = product.id ? product.id.charCodeAt(product.id.length - 1) % pool.length : 0;
  return pool[idx];
};

const ProductCard = ({ product }) => {
  const { toggleFavorite, isFavorite } = useArt();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isFav = isFavorite(product.id);
  const [hovered, setHovered] = useState(false);
  const secondImage = getSecondImage(product);

  return (
    <div
      className="product-card glass-panel animate-fade-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="card-image-container">
        {/* Primary image */}
        <img
          src={product.image}
          alt={product.title}
          className={`card-image card-image-primary ${hovered ? 'hidden' : ''}`}
        />
        {/* Secondary lifestyle image on hover */}
        <img
          src={secondImage}
          alt={`${product.title} lifestyle`}
          className={`card-image card-image-secondary ${hovered ? 'visible' : ''}`}
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

        {/* Image dots indicator */}
        <div className="card-image-dots">
          <span className={`dot ${!hovered ? 'active' : ''}`} />
          <span className={`dot ${hovered ? 'active' : ''}`} />
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
