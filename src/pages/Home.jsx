import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { categories } from '../data/mockData';
import { useArt } from '../context/ArtContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const { artworks } = useArt();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const featuredArtworks = artworks.filter(art => art.featured);

  // Smooth scroll helper for landing hash target
  useEffect(() => {
    if (location.hash === '#categories') {
      const element = document.getElementById('categories');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  const recommendations = searchQuery.trim() === '' 
    ? categories 
    : categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (recommendations.length > 0) {
      navigate(`/category/${recommendations[0].id}`);
    }
  };

  const handleRecommendationClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  const handleExploreClick = (e) => {
    e.preventDefault();
    const element = document.getElementById('categories');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };



  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content animate-fade-in">
          <h1 className="hero-title">Tote Art Gallery</h1>
          <p className="hero-subtitle">Authentic Paintings and Sketches from exceptional creators.</p>
          
          <div className="hero-search-container">
            <form className={`hero-search-bar ${isSearchFocused ? 'focused' : ''}`} onSubmit={handleSearchSubmit}>
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search paintings, sketches..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
            </form>
            {isSearchFocused && recommendations.length > 0 && (
              <div className="search-recommendations glass-panel">
                {recommendations.map(cat => (
                  <div key={cat.id} className="recommendation-item" onClick={() => handleRecommendationClick(cat.id)}>
                    <svg className="rec-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          <div className="hero-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <a href="#categories" onClick={handleExploreClick} className="btn-primary">Explore Collection</a>
            {user && (
              <Link 
                to="/profile"
                className="btn-outline" 
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
              >
                {user.role === 'admin' ? 'Manage Gallery' : 'Profile Details'}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="categories-section container">
        <h2 className="section-title">Curated Categories</h2>
        <div className="categories-grid">
          {categories.map(category => (
            <Link to={`/category/${category.id}`} key={category.id} className="category-card glass-panel">
              <img src={category.image} alt={category.name} className="category-image" />
              <div className="category-content">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Artworks */}
      <section className="featured-section container">
        <h2 className="section-title">Featured Artworks</h2>
        <div className="products-grid">
          {featuredArtworks.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      
    </div>
  );
};

export default Home;
