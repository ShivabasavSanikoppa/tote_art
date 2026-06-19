import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Validate active session on page reload / mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          signal: controller.signal,
          credentials: 'include'
        });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (data.token) {
              sessionStorage.setItem('tote_token', data.token);
            }
            setUser(data.user);
          }
        }
      } catch (err) {
        console.warn("Backend not reachable, running in frontend-only mode");
      } finally {
        setLoading(false);
      }
    };
    checkActiveSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.token) {
          sessionStorage.setItem('tote_token', data.token);
        }
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Login failed.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.token) {
          sessionStorage.setItem('tote_token', data.token);
        }
        setUser(data.user);
        setUsers(prev => [...prev, data.user]);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Registration failed.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      sessionStorage.removeItem('tote_token');
      setUser(null);
    }
  };

  const updateUserProfile = async (updatedDetails) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedDetails)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.token) {
          sessionStorage.setItem('tote_token', data.token);
        }
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to update settings.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error("Failed to fetch registered users list", err);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete user.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      loading,
      login,
      register,
      logout,
      updateUserProfile,
      fetchUsers,
      deleteUser
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
