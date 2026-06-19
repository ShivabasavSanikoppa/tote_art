import React from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartSidebar.css';

const CartSidebar = () => {
  const { cartItems, isCartOpen, toggleCart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleCheckout = () => {
    toggleCart();
    navigate('/checkout');
  };

  return (
    <>
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={toggleCart}></div>
      <div className={`cart-sidebar glass-panel ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart ({totalCount})</h2>
          <button className="close-btn" onClick={toggleCart}><X /></button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.title} className="cart-item-image" />
                <div className="cart-item-details">
                  <h4>{item.title}</h4>
                  <p>₹{(item.price * (item.quantity || 1)).toLocaleString()}</p>
                  <div className="cart-item-qty">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, -1)}
                      title="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="qty-value">{item.quantity || 1}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, 1)}
                      title="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <button className="remove-btn" onClick={() => removeFromCart(item.id)} title="Remove item">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <button className="btn-primary checkout-btn" onClick={handleCheckout}>Proceed to Checkout</button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
