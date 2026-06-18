import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API_BASE from '../api';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        try {
          const response = await fetch(`${API_BASE}/api/orders`, { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setOrders(data.orders);
            }
          }
        } catch (err) {
          console.error("Failed to fetch orders from server", err);
        }
      };
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  const addOrder = async (orderDetails) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderDetails)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => [data.order, ...prev]);
        return { success: true, order: data.order };
      }
      return { success: false, message: data.message || 'Failed to place order.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to update order status.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete order.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const clearOrderHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/clear-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders([]);
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to clear history.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const hideOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to remove order.' };
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok && data.success) {
          setOrders(prev => prev.filter(order => order.id !== orderId));
          return { success: true };
        }
        return { success: false, message: data.message || 'Failed to cancel order.' };
      } else {
        return { success: false, message: `Server error: ${response.status}` };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, deleteOrder, clearOrderHistory, hideOrder, cancelOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
