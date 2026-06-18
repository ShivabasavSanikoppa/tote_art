import React from 'react';
import { Link } from 'react-router-dom';
import { useArt } from '../context/ArtContext';
import ProductCard from '../components/ProductCard';
import { Heart } from 'lucide-react';
import './Favorites.css';

const Favorites = () => {
  const { artworks, favorites } = useArt();

  // Get only the artworks that have been favorited
  const favoritedItems = artworks.filter(art => favorites.includes(art.id));

  return (
    <div className="favorites-page container animate-fade-in">
      <h1 className="section-title">My Favorites</h1>
      
      {favoritedItems.length > 0 ? (
        <div className="products-grid">
          {favoritedItems.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="favorites-empty glass-panel animate-fade-in">
          <div className="heart-circle">
            <Heart size={40} className="empty-heart-icon" />
          </div>
          <h3>Your Collection is Empty</h3>
          <p>You haven't marked any artworks as your favorites yet. Keep browsing to curate your personal gallery of favorite pieces.</p>
          <Link to="/#categories" className="btn-primary explore-btn">
            Explore Artworks
          </Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
