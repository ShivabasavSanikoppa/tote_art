import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const storedCart = localStorage.getItem(`tote_cart_${user.id}`);
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (e) {
          console.error("Error parsing stored cart", e);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [user]);

  const saveCart = (cart, userId) => {
    localStorage.setItem(`tote_cart_${userId}`, JSON.stringify(cart));
  };

  const addToCart = (product) => {
    if (!user) return;
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      let newCart;
      if (existing) {
        // Increment quantity if already in cart
        newCart = prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        newCart = [...prev, { ...product, quantity: 1 }];
      }
      saveCart(newCart, user.id);
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    if (!user) return;
    setCartItems(prev => {
      const newCart = prev.filter(item => item.id !== productId);
      saveCart(newCart, user.id);
      return newCart;
    });
  };

  const updateQuantity = (productId, delta) => {
    if (!user) return;
    setCartItems(prev => {
      const newCart = prev
        .map(item =>
          item.id === productId
            ? { ...item, quantity: (item.quantity || 1) + delta }
            : item
        )
        .filter(item => item.quantity > 0); // remove if quantity drops to 0
      saveCart(newCart, user.id);
      return newCart;
    });
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const clearCart = () => {
    if (!user) return;
    setCartItems([]);
    localStorage.removeItem(`tote_cart_${user.id}`);
  };

  // Total item count including quantities
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, addToCart, removeFromCart, updateQuantity, isCartOpen, toggleCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

