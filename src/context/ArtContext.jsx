import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ArtContext = createContext();

export const ArtProvider = ({ children }) => {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites from DB when user logs in/out
  useEffect(() => {
    if (user && user.id) {
      const fetchFavorites = async () => {
        try {
          const res = await fetch('/api/favorites');
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setFavorites(data.artworkIds);
            }
          }
        } catch (e) {
          console.error('Failed to load favorites from server', e);
          // Fall back to localStorage if server is unreachable
          const key = `favorites_${user.id}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            try { setFavorites(JSON.parse(stored)); } catch { setFavorites([]); }
          }
        }
      };
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const toggleFavorite = async (id) => {
    if (!user || !user.id) return;
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFavorites(data.artworkIds);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to sync favorite to server, using localStorage fallback', e);
    }
    // localStorage fallback if server fails
    const key = `favorites_${user.id}`;
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (id) => {
    if (!user || !user.id) return false;
    return favorites.includes(id);
  };

  // Fetch all artworks from API on mount
  const fetchArtworks = async () => {
    try {
      const response = await fetch('/api/artworks');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setArtworks(data.artworks);
        }
      }
    } catch (e) {
      console.error("Failed to load artworks from server", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  const addArtwork = async (newArtwork) => {
    try {
      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArtwork)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setArtworks(prev => [data.artwork, ...prev]);
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to publish artwork.' };
    } catch (e) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const removeArtwork = async (id) => {
    try {
      const response = await fetch(`/api/artworks/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setArtworks(prev => prev.filter(art => art.id !== id));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to remove artwork.' };
    } catch (e) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const updateArtwork = async (id, updatedData) => {
    try {
      const response = await fetch(`/api/artworks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setArtworks(prev => prev.map(art => art.id === id ? data.artwork : art));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to update artwork.' };
    } catch (e) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  return (
    <ArtContext.Provider value={{ artworks, addArtwork, removeArtwork, updateArtwork, loading, favorites, toggleFavorite, isFavorite }}>
      {!loading && children}
    </ArtContext.Provider>
  );
};

export const useArt = () => useContext(ArtContext);
