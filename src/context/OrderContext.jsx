import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  // Fetch orders when the authenticated user changes
  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        try {
          const response = await fetch('/api/orders');
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
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => [data.order, ...prev]);
        return { success: true, order: data.order };
      }
      return { success: false, message: data.message || 'Failed to place order.' };
    } catch (err) {
      console.error("Failed to place order", err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      console.error("Failed to update order status", err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete order.' };
    } catch (err) {
      console.error("Failed to delete order", err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  const clearOrderHistory = async () => {
    try {
      const response = await fetch('/api/orders/clear-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders([]);
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to clear history.' };
    } catch (err) {
      console.error("Failed to clear history", err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  const hideOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to remove order.' };
    } catch (err) {
      console.error("Failed to remove order", err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok && data.success) {
          // Remove cancelled order from local active list
          setOrders(prev => prev.filter(order => order.id !== orderId));
          return { success: true };
        }
        return { success: false, message: data.message || 'Failed to cancel order.' };
      } else {
        return { success: false, message: `Server returned error status: ${response.status} (${response.statusText})` };
      }
    } catch (err) {
      console.error("Failed to cancel order", err);
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
