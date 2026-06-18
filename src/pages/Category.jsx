import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { categories } from '../data/mockData';
import { useArt } from '../context/ArtContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import './Category.css';

const Category = () => {
  const { categoryId } = useParams();
  const { artworks, addArtwork } = useArt();
  const { user } = useAuth();
  const [activeSub, setActiveSub] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newHowMade, setNewHowMade] = useState('');
  const [newFeatured, setNewFeatured] = useState(false);

  const categoryInfo = categories.find(c => c.id === categoryId);
  
  useEffect(() => {
    if (categoryInfo && categoryInfo.subCategories && categoryInfo.subCategories.length > 0) {
      setActiveSub(categoryInfo.subCategories[0]); 
      setNewSubCategory(categoryInfo.subCategories[0]); // Default form select
    } else {
      setActiveSub('');
      setNewSubCategory('');
    }
    setShowUploadForm(false);
    
    // Reset form fields when category changes
    setNewTitle('');
    setNewArtist('');
    setNewPrice('');
    setNewImage('');
    setNewDescription('');
    setNewHowMade('');
    setNewFeatured(false);
  }, [categoryId, categoryInfo]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result); // This is a base64 Data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    
    // Create new artwork object
    const newArt = {
      title: newTitle,
      category: categoryId,
      subCategory: newSubCategory,
      artist: newArtist.trim() || user.name,
      price: Number(newPrice),
      currency: 'INR',
      image: newImage || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop',
      description: newDescription || 'A beautiful newly uploaded artwork.',
      howItsMade: newHowMade || 'Created with passion and dedication.',
      featured: newFeatured
    };

    addArtwork(newArt);
    setShowUploadForm(false);
    setNewTitle('');
    setNewArtist('');
    setNewPrice('');
    setNewImage('');
    setNewDescription('');
    setNewHowMade('');
    setNewFeatured(false);
    
    // Automatically switch to the subcategory where the user uploaded it
    if (newSubCategory) {
      setActiveSub(newSubCategory);
    }
  };

  const filteredArtworks = artworks.filter(art => {
    if (art.category !== categoryId) return false;
    if (categoryInfo && categoryInfo.subCategories && categoryInfo.subCategories.length > 0) {
      if (art.subCategory !== activeSub) return false;
    }
    return true;
  });

  return (
    <div className="category-page" style={{
      backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url(${categoryInfo?.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center 30%',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      {/* Category Hero Banner */}
      {categoryInfo && (
        <div 
          className="category-hero" 
          style={{ 
            background: 'transparent',
            minHeight: '450px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            marginTop: '0',
            paddingTop: '80px'
          }}
        >
          <div className="container animate-fade-in">
            <h1 style={{ 
              fontSize: '5rem', 
              fontWeight: '800',
              color: '#ffffff', 
              fontFamily: 'var(--font-heading)',
              letterSpacing: '2px',
              textShadow: '0 4px 15px rgba(0, 0, 0, 0.8), 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 0, 0, 0.5)',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.1'
            }}>
              {categoryInfo.name}
            </h1>
            <p style={{ 
              fontSize: '1.35rem', 
              fontWeight: '500',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 4px 20px rgba(0, 0, 0, 0.7)',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: '1.6',
              letterSpacing: '0.5px'
            }}>
              {categoryInfo.description}
            </p>
          </div>
        </div>
      )}

      <div className="container" style={{ minHeight: '40vh', paddingTop: '1.5rem', position: 'relative', zIndex: 5 }}>
        {user && user.role === 'admin' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <button className="btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
              {showUploadForm ? 'Cancel Upload' : `Upload to ${categoryInfo?.name}`}
            </button>
          </div>
        )}
        
        {user && user.role === 'admin' && showUploadForm && (
          <div className="category-upload-form glass-panel animate-fade-in">
            <h2>Upload Your {categoryInfo?.name}</h2>
            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label>Artwork Title *</label>
                <input type="text" required placeholder="e.g. Masterpiece" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Artist Name</label>
                <input type="text" placeholder={`Defaults to: ${user?.name}`} value={newArtist} onChange={(e) => setNewArtist(e.target.value)} />
              </div>
              {categoryInfo?.subCategories && (
                <div className="form-group">
                  <label>Sub Category</label>
                  <select required value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)}>
                    {categoryInfo.subCategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Price (INR) *</label>
                <input type="number" required placeholder="e.g. 5000" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" placeholder="Describe the artwork..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', padding: '0.8rem' }} />
              </div>
              <div className="form-group">
                <label>How It's Made</label>
                <textarea rows="2" placeholder="Materials, techniques..." value={newHowMade} onChange={(e) => setNewHowMade(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', padding: '0.8rem' }} />
              </div>
              <div className="form-group">
                <label>Upload Image (.jpg, .jpeg, .png)</label>
                <input 
                  type="file" 
                  accept=".jpg, .jpeg, .png" 
                  onChange={handleImageUpload} 
                  style={{ marginBottom: '0.5rem' }}
                />
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Or provide an Image URL (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Enter valid image URL..." 
                  value={newImage.startsWith('data:') ? '' : newImage}
                  onChange={(e) => setNewImage(e.target.value)} 
                />
                {newImage.startsWith('data:') && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', display: 'block', marginTop: '0.5rem' }}>
                    Local file successfully attached!
                  </span>
                )}
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="cat-featured" checked={newFeatured} onChange={(e) => setNewFeatured(e.target.checked)} />
                <label htmlFor="cat-featured" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Feature on Home Page</label>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Publish Artwork</button>
            </form>
          </div>
        )}

        {!showUploadForm && categoryInfo && categoryInfo.subCategories && categoryInfo.subCategories.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {categoryInfo.subCategories.map(sub => (
              <button 
                key={sub}
                className={`btn-outline ${activeSub === sub ? 'active-filter' : ''}`}
                style={{ backgroundColor: activeSub === sub ? 'rgba(212, 175, 55, 0.1)' : 'transparent' }}
                onClick={() => setActiveSub(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {!showUploadForm && (
          filteredArtworks.length > 0 ? (
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
              {filteredArtworks.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p style={{ marginTop: '4rem' }}>No artworks found in this category yet.</p>
          )
        )}
      </div>
    </div>
  );
};

export default Category;
