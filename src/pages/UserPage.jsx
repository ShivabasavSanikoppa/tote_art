import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useArt } from '../context/ArtContext';
import { Navigate, Link } from 'react-router-dom';
import { Mail, Calendar, Shield, ShoppingBag, Lock, CheckCircle, Clock, Truck, Heart, Trash2, XCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import API_BASE from '../api';
import './UserPage.css';

const UserPage = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const { orders, clearOrderHistory, hideOrder, cancelOrder } = useOrders();
  const { artworks, favorites } = useArt();
  
  const isWithin24Hours = (dateStr) => {
    const orderDate = new Date(dateStr);
    const diffTime = Math.abs(new Date() - orderDate);
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours < 24;
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order? This action cannot be undone and will move the order to the cancelled list.")) {
      const res = await cancelOrder(orderId);
      if (res.success) {
        alert("Order cancelled successfully.");
      } else {
        alert(res.message || "Failed to cancel order.");
      }
    }
  };
  
  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear your entire purchase history? This action cannot be undone.")) {
      const res = await clearOrderHistory();
      if (!res.success) {
        alert(res.message || "Failed to clear history.");
      }
    }
  };

  const handleHideOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to remove this order from your history?")) {
      const res = await hideOrder(orderId);
      if (!res.success) {
        alert(res.message || "Failed to remove order.");
      }
    }
  };
  
  // Dashboard tab controls
  const [activeTab, setActiveTab] = useState('purchases');
  
  // Profile settings state
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [password, setPassword] = useState(user ? user.password : '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Cancelled orders state
  const [cancelledOrders, setCancelledOrders] = useState([]);

  // Fetch cancelled orders when tab is opened
  const fetchMyCancelledOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/my-cancelled-orders`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setCancelledOrders(data.cancelledOrders);
      }
    } catch (e) {
      console.error('Failed to fetch cancelled orders', e);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admin if they hit /user
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Get current user's orders
  const userOrders = orders.filter(order => order.userId === user.id);
  const favoritedItems = artworks.filter(art => favorites.includes(art.id));

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    
    const res = await updateUserProfile({ name, email, password });
    if (res.success) {
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setProfileMsg({ text: '', type: '' }), 4000);
    } else {
      setProfileMsg({ text: res.message || 'Failed to update profile.', type: 'error' });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle size={16} color="#2ecc71" />;
      case 'Shipped':
        return <Truck size={16} color="#d4af37" />;
      case 'Placed':
        return <CheckCircle size={16} color="#3498db" />;
      case 'Awaiting Payment':
      default:
        return <Clock size={16} color="#f1c40f" />;
    }
  };

  return (
    <div className="user-dashboard container animate-fade-in" style={{ paddingTop: '120px', minHeight: '85vh', paddingBottom: '60px' }}>
      
      {/* Profile Summary Panel */}
      <div className="profile-header-panel glass-panel" style={{ marginBottom: '2.5rem' }}>
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="profile-info-block">
          <div className="profile-meta-top">
            <h1 className="profile-name">{user.name}</h1>
            <span className="profile-badge">
              <Shield size={12} style={{ marginRight: '4px' }} />
              Premium Member
            </span>
          </div>
          <div className="profile-meta-grid">
            <div className="meta-item">
              <Mail size={16} className="meta-icon" />
              <span>{user.email}</span>
            </div>
            <div className="meta-item">
              <Calendar size={16} className="meta-icon" />
              <span>Member since {user.joinedDate}</span>
            </div>
          </div>
        </div>
        <div className="profile-header-actions">
          <button className="btn-outline logout-btn" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>

      {/* Dashboard Content Layout (Sidebar + Tabs) */}
      <div className="dashboard-content-layout">
        <aside className="dashboard-sidebar glass-panel">
          <button 
            className={`sidebar-link ${activeTab === 'purchases' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchases')}
          >
            <ShoppingBag size={18} />
            <span>My Art Purchases</span>
            {userOrders.length > 0 && <span className="tab-count-badge">{userOrders.length}</span>}
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={18} />
            <span>My Favorites</span>
            {favoritedItems.length > 0 && <span className="tab-count-badge">{favoritedItems.length}</span>}
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => { setActiveTab('cancelled'); fetchMyCancelledOrders(); }}
          >
            <XCircle size={18} />
            <span>Cancelled Orders</span>
            {cancelledOrders.length > 0 && <span className="tab-count-badge">{cancelledOrders.length}</span>}
          </button>
          
          <button 
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Lock size={18} />
            <span>Account Security</span>
          </button>
        </aside>

        <main className="dashboard-main-area glass-panel">
          {activeTab === 'purchases' && (
            <div className="purchases-view">
              <h2 className="tab-title">Purchased Masterpieces</h2>
              <p className="tab-subtitle">Track your secure shipments and acquired collection items.</p>
              
              {userOrders.length > 0 ? (
                <div className="orders-timeline">
                  {userOrders.map(order => (
                    <div key={order.id} className="order-log-card">
                      <div className="order-log-header">
                        <div>
                          <span className="order-id-tag">ORDER: #{order.id.substring(4)}</span>
                          <span className="order-date-tag">Date: {new Date(order.date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <div className="order-status-badge" data-status={order.status}>
                            {getStatusIcon(order.status)}
                            <span style={{ marginLeft: '6px' }}>{order.status}</span>
                          </div>
                          {isWithin24Hours(order.date) && (
                            <button 
                              className="btn-outline" 
                              onClick={() => handleCancelOrder(order.id)}
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.75rem',
                                borderColor: '#e74c3c',
                                color: '#e74c3c',
                                height: 'auto',
                                marginBottom: 0,
                                cursor: 'pointer'
                              }}
                            >
                              Cancel Order
                            </button>
                          )}
                           {order.status === 'Delivered' && (
                            <button 
                              className="delete-order-btn" 
                              onClick={() => handleHideOrder(order.id)}
                              title="Remove Order From History"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#e74c3c',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease',
                                opacity: 0.8
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
                                e.currentTarget.style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.opacity = '0.8';
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="order-log-items">
                        {order.items.map(item => (
                          <div key={item.id} className="order-item-row">
                            <img src={item.image} alt={item.title} className="order-item-img" />
                            <div className="order-item-info">
                              <h4 className="order-item-title">{item.title}</h4>
                              <p className="order-item-cat">Category: {item.category.toUpperCase()}</p>
                            </div>
                            <div className="order-item-price">
                              ₹{item.price.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-log-footer">
                        <div className="order-shipping-summary">
                          <strong>Shipping To:</strong> {order.customerName}, {order.shippingAddress}, {order.city} - {order.postalCode}
                        </div>
                        <div className="order-total-block">
                          Total Amount Paid: <span className="total-amount">₹{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <ShoppingBag size={48} className="empty-icon" />
                  <h3>Your collection is empty</h3>
                  <p>You haven't purchased any artworks yet. Explore the gallery to find your first masterpiece.</p>
                  <Link to="/#categories" className="btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
                    Browse Gallery
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="purchases-view">
              <h2 className="tab-title">My Curated Favorites</h2>
              <p className="tab-subtitle">Your personally saved gallery masterpieces.</p>
              
              {favoritedItems.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                  {favoritedItems.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Heart size={48} className="empty-icon" style={{ color: 'var(--accent-gold)' }} />
                  <h3>Your Favorites Folder is Empty</h3>
                  <p>You haven't saved any artworks yet. Explore the gallery to add items to your favorites.</p>
                  <Link to="/#categories" className="btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
                    Explore Artworks
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cancelled' && (
            <div className="purchases-view">
              <h2 className="tab-title">Cancelled Orders</h2>
              <p className="tab-subtitle">History of orders you have cancelled.</p>

              {cancelledOrders.length > 0 ? (
                <div className="orders-timeline">
                  {cancelledOrders.map(order => (
                    <div key={order.id} className="order-log-card">
                      <div className="order-log-header">
                        <div>
                          <span className="order-id-tag">ORDER: #{order.originalOrderId?.substring(4)}</span>
                          <span className="order-date-tag">Cancelled: {new Date(order.cancelledDate).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{
                            padding: '0.3rem 0.8rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            background: 'rgba(231,76,60,0.1)',
                            color: '#e74c3c',
                            border: '1px solid rgba(231,76,60,0.2)'
                          }}>
                            Cancelled
                          </span>
                          {order.paymentDone && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#f39c12',
                              background: 'rgba(243,156,18,0.1)',
                              border: '1px solid rgba(243,156,18,0.2)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px'
                            }}>
                              Refund Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="order-log-items">
                        {order.items.map(item => (
                          <div key={item.id} className="order-item-row">
                            <img src={item.image} alt={item.title} className="order-item-img" />
                            <div className="order-item-info">
                              <h4 className="order-item-title">{item.title}</h4>
                              <p className="order-item-cat">Category: {item.category?.toUpperCase()}</p>
                            </div>
                            <div className="order-item-price">₹{item.price?.toLocaleString('en-IN')}</div>
                          </div>
                        ))}
                      </div>

                      <div className="order-log-footer">
                        <div className="order-shipping-summary">
                          <strong>Was shipping to:</strong> {order.customerName}, {order.shippingAddress}, {order.city}
                        </div>
                        <div className="order-total-block">
                          Total: <span className="total-amount">₹{order.total?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <XCircle size={48} className="empty-icon" style={{ color: '#e74c3c', opacity: 0.5 }} />
                  <h3>No Cancelled Orders</h3>
                  <p>You haven't cancelled any orders.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-view">
              <h2 className="tab-title">Account Settings</h2>
              <p className="tab-subtitle">Keep your private settings and login credentials up to date.</p>
              
              {profileMsg.text && (
                <div className={`alert-box alert-${profileMsg.type}`} style={{
                  padding: '1rem',
                  borderRadius: '4px',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  background: profileMsg.type === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                  border: `1px solid ${profileMsg.type === 'success' ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
                  color: profileMsg.type === 'success' ? '#2ecc71' : '#e74c3c'
                }}>
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>

                <button type="submit" className="btn-primary submit-profile-btn" style={{ marginTop: '1rem' }}>
                  Update Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

    </div>
  );
};

export default UserPage;
