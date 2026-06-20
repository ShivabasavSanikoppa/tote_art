import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API_BASE from '../api';

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
          const res = await fetch(`${API_BASE}/api/favorites`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setFavorites(data.artworkIds);
            }
          }
        } catch (e) {
          console.error('Failed to load favorites from server', e);
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
      const res = await fetch(`${API_BASE}/api/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  // Fetch all artworks from API on mount — also merge inventory quantities
  const fetchArtworks = async () => {
    try {
      const [artRes, invRes] = await Promise.all([
        fetch(`${API_BASE}/api/artworks`),
        fetch(`${API_BASE}/api/inventory/all`)
      ]);

      if (artRes.ok) {
        const artData = await artRes.json();
        if (artData.success) {
          let arts = artData.artworks;
          // Merge inventory quantities if available
          if (invRes.ok) {
            try {
              const invData = await invRes.json();
              if (invData.success && invData.inventory) {
                const invMap = {};
                invData.inventory.forEach(r => { invMap[r.artworkId] = r.quantity; });
                arts = arts.map(a => ({
                  ...a,
                  quantity: invMap[a.id] !== undefined ? invMap[a.id] : (a.quantity ?? 0)
                }));
              }
            } catch (e) { /* use artwork quantity as fallback */ }
          }
          setArtworks(arts);
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
      const response = await fetch(`${API_BASE}/api/artworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      const response = await fetch(`${API_BASE}/api/artworks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
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
      const response = await fetch(`${API_BASE}/api/artworks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
