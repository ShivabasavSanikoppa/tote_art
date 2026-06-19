import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useArt } from '../context/ArtContext';
import { useOrders } from '../context/OrderContext';
import { Plus, Edit2, Trash2, Star, TrendingUp, Users, Package, Clock, Shield, LogOut, ShoppingBag, Lock, Mail, Calendar, Grid, List, CheckCircle, Truck, XCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import API_BASE from '../api';
import './AdminPage.css';

const AdminPage = () => {
  const { user, users, login, logout, deleteUser, updateUserProfile, fetchUsers } = useAuth();
  const { artworks, addArtwork, removeArtwork, updateArtwork } = useArt();
  const { orders, updateOrderStatus, deleteOrder } = useOrders();

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
      
      // Fetch active WhatsApp number settings
      const fetchWhatsAppSetting = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/settings/whatsapp`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.whatsappNumber) {
              setWhatsappNumber(data.whatsappNumber);
            }
          }
        } catch (err) {
          console.error('Failed to fetch WhatsApp number settings:', err);
        }
      };
      fetchWhatsAppSetting();

      // Fetch all cancelled orders
      const fetchCancelledOrders = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/cancelled-orders`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.cancelledOrders) {
              setCancelledOrders(data.cancelledOrders);
            }
          }
        } catch (err) {
          console.error('Failed to fetch cancelled orders:', err);
        }
      };
      fetchCancelledOrders();
    }
  }, [user]);

  // Tab controls: inventory, orders, users, purchases, security
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventoryView, setInventoryView] = useState('grid'); // 'grid' or 'table'

  // Order filtering and details view states
  const [orderFilter, setOrderFilter] = useState('all'); // 'unplaced' or 'placed'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [analysisYear, setAnalysisYear] = useState('All');
  const [analysisMonth, setAnalysisMonth] = useState('All');

  // Admin login states (if not logged in as admin)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Modal States for Add/Edit Artwork
  const [isArtModalOpen, setIsArtModalOpen] = useState(false);
  const [editingArt, setEditingArt] = useState(null);

  // Form states for Add/Edit Artwork
  const [artTitle, setArtTitle] = useState('');
  const [artArtist, setArtArtist] = useState('');
  const [artCategory, setArtCategory] = useState('paintings');
  const [artSubCategory, setArtSubCategory] = useState('Scenery');
  const [artPrice, setArtPrice] = useState('');
  const [artImage, setArtImage] = useState('');
  const [artDescription, setArtDescription] = useState('');
  const [artHowMade, setArtHowMade] = useState('');
  const [artFeatured, setArtFeatured] = useState(false);

  // Admin profile settings states
  const [adminName, setAdminName] = useState(user ? user.name : '');
  const [adminMail, setAdminMail] = useState(user ? user.email : '');
  const [adminPass, setAdminPass] = useState(user ? user.password : '');
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' });

  // WhatsApp settings states
  const [whatsappNumber, setWhatsappNumber] = useState('9019832399');
  const [whatsappMsg, setWhatsappMsg] = useState({ text: '', type: '' });

  // Cancelled orders state
  const [cancelledOrders, setCancelledOrders] = useState([]);

  // Handle Admin direct login on this page
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    // Attempt credentials match
    const res = await login(adminEmail, adminPassword);
    if (res.success) {
      // Login worked. Now verify they are actually an Admin
      // Note: useAuth login sets active user in context
      const match = users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());
      if ((match && match.role === 'admin') || (res.user && res.user.role === 'admin')) {
        // Success
        const adminUser = res.user || match;
        setAdminName(adminUser.name);
        setAdminMail(adminUser.email);
        setAdminPass(adminUser.password || '');
      } else {
        // Logged in but not admin
        logout();
        setLoginError('Access Denied. Only registered administrators can log in here.');
      }
    } else {
      setLoginError(res.message || 'Invalid credentials.');
    }
  };

  // If not logged in as admin, show dedicated login page
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-login-wrapper container animate-fade-in" style={{ paddingTop: '120px', paddingBottom: '60px' }}>
        <div className="login-container glass-panel" style={{ maxWidth: '450px', margin: '0 auto' }}>
          <div className="login-header text-center" style={{ marginBottom: '2rem' }}>
            <Shield size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            <h1 className="section-title" style={{ margin: 0, fontSize: '2rem' }}>Admin Portal</h1>
            <p className="login-subtitle" style={{ marginTop: '0.5rem' }}>Secure sign-in for system administrators only.</p>
          </div>

          {loginError && (
            <div style={{ color: '#e74c3c', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', padding: '0.8rem', background: 'rgba(231,76,60,0.1)', borderRadius: '4px', border: '1px solid rgba(231,76,60,0.2)' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="login-form">
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Admin Email</label>
              <input 
                type="email" 
                required 
                placeholder="admin@tote.com" 
                value={adminEmail} 
                onChange={(e) => setAdminEmail(e.target.value)} 
                style={{ padding: '0.9rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'white', borderRadius: '4px', outline: 'none' }}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Secure Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)} 
                style={{ padding: '0.9rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'white', borderRadius: '4px', outline: 'none' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', letterSpacing: '1px' }}>
              Verify Credentials
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin calculations
  const totalArtworks = artworks.length;
  const totalRevenue = orders
    .filter(order => order.status !== 'Awaiting Payment' && order.status !== 'Pending')
    .reduce((sum, order) => sum + order.total, 0);
  const activeUsersCount = users.length;
  const awaitingPayment = orders.filter(o => o.status === 'Awaiting Payment' || o.status === 'Pending').length;
  const paidPlaced = orders.filter(o => o.status === 'Placed').length;
  const activeOrdersCount = awaitingPayment + paidPlaced;

  // Admin's own purchases
  const adminOrders = orders.filter(order => order.userId === user.id);

  // --- Sales Analysis Aggregation Logic ---
  // Get available years dynamically
  const availableYears = Array.from(new Set(orders.map(order => {
    const d = new Date(order.date);
    return d.getFullYear();
  }).filter(Boolean))).sort((a, b) => b - a);

  const monthsNameList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter orders based on Year & Month selection
  const filteredAnalysisOrders = orders.filter(order => {
    if (order.status === 'Awaiting Payment' || order.status === 'Pending') {
      return false;
    }
    const date = new Date(order.date);
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'long' });
    
    const yearMatch = analysisYear === 'All' || year.toString() === analysisYear;
    const monthMatch = analysisMonth === 'All' || monthName === analysisMonth;
    
    return yearMatch && monthMatch;
  });

  // 1. Time-series (Year & Month) grouping
  const salesByTime = {};
  filteredAnalysisOrders.forEach(order => {
    const date = new Date(order.date);
    const year = date.getFullYear() || 2026;
    const monthName = date.toLocaleString('default', { month: 'long' });
    const monthIndex = date.getMonth();
    
    if (!salesByTime[year]) {
      salesByTime[year] = {
        year,
        totalIncome: 0,
        totalOrders: 0,
        months: {}
      };
    }
    
    salesByTime[year].totalIncome += order.total;
    salesByTime[year].totalOrders += 1;
    
    if (!salesByTime[year].months[monthName]) {
      salesByTime[year].months[monthName] = {
        monthName,
        monthIndex,
        totalIncome: 0,
        totalOrders: 0
      };
    }
    
    salesByTime[year].months[monthName].totalIncome += order.total;
    salesByTime[year].months[monthName].totalOrders += 1;
  });

  // Sort years and months logically
  const yearsList = Object.values(salesByTime).sort((a, b) => b.year - a.year);
  yearsList.forEach(y => {
    y.sortedMonths = Object.values(y.months).sort((a, b) => b.monthIndex - a.monthIndex);
  });

  // 2. Customer Breakdown ("Who all ordered") - handled inline via filteredAnalysisOrders

  // 3. Artwork sales
  const artworkMap = {};
  filteredAnalysisOrders.forEach(order => {
    order.items.forEach(item => {
      if (!artworkMap[item.id]) {
        artworkMap[item.id] = {
          title: item.title,
          image: item.image,
          category: item.category,
          quantity: 0,
          revenue: 0
        };
      }
      artworkMap[item.id].quantity += 1;
      artworkMap[item.id].revenue += item.price;
    });
  });
  const topArtworks = Object.values(artworkMap).sort((a, b) => b.quantity - a.quantity);

  // 4. Category sales
  const categoryMap = {};
  filteredAnalysisOrders.forEach(order => {
    order.items.forEach(item => {
      const cat = item.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          category: cat,
          quantity: 0,
          revenue: 0
        };
      }
      categoryMap[cat].quantity += 1;
      categoryMap[cat].revenue += item.price;
    });
  });
  const topCategories = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

  const handleOpenAddModal = () => {
    setEditingArt(null);
    setArtTitle('');
    setArtArtist(user.name);
    setArtCategory('paintings');
    setArtSubCategory('Scenery');
    setArtPrice('');
    setArtImage('');
    setArtDescription('');
    setArtHowMade('');
    setArtFeatured(false);
    setIsArtModalOpen(true);
  };

  const handleOpenEditModal = (art) => {
    setEditingArt(art);
    setArtTitle(art.title);
    setArtArtist(art.artist || '');
    setArtCategory(art.category || 'paintings');
    setArtSubCategory(art.subCategory || '');
    setArtPrice(art.price.toString());
    setArtImage(art.image || '');
    setArtDescription(art.description || '');
    setArtHowMade(art.howItsMade || '');
    setArtFeatured(art.featured || false);
    setIsArtModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        window.alert("File size is too large. Please select an image under 5MB.");
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setArtImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleArtSubmit = async (e) => {
    e.preventDefault();
    
    let finalImageUrl = artImage.trim();
    if (!finalImageUrl) {
      if (artCategory === 'paintings') {
        finalImageUrl = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop';
      } else if (artCategory === 'sketch') {
        finalImageUrl = 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop';
      } else {
        finalImageUrl = 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?q=80&w=800&auto=format&fit=crop';
      }
    }

    const artData = {
      title: artTitle,
      artist: artArtist || 'Tote Gallery',
      category: artCategory,
      subCategory: artSubCategory.trim(),
      price: Number(artPrice),
      image: finalImageUrl,
      description: artDescription,
      howItsMade: artHowMade,
      featured: artFeatured
    };

    let res;
    if (editingArt) {
      res = await updateArtwork(editingArt.id, artData);
    } else {
      res = await addArtwork(artData);
    }

    if (res && res.success) {
      setIsArtModalOpen(false);
    } else {
      window.alert(res?.message || 'Failed to publish artwork.');
    }
  };

  const handleDeleteArt = (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      removeArtwork(id);
    }
  };

  const handleDeleteOrder = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if (order.status !== 'Delivered') {
      window.alert('Only orders with status "Delivered" can be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently remove order #${id.substring(4)}?`)) {
      const res = await deleteOrder(id);
      if (res && !res.success) {
        window.alert(res.message || 'Failed to remove order.');
      }
    }
  };

  const handleDeleteUserClick = async (id, email) => {
    if (window.confirm(`Are you sure you want to permanently delete the user account for "${email}"?`)) {
      const res = await deleteUser(id);
      if (res && !res.success) {
        window.alert(res.message || 'Failed to delete user account.');
      }
    }
  };

  const handleAdminProfileSubmit = async (e) => {
    e.preventDefault();
    setSettingsMsg({ text: '', type: '' });
    
    const res = await updateUserProfile({ name: adminName, email: adminMail, password: adminPass });
    if (res.success) {
      setSettingsMsg({ text: 'Admin security settings updated successfully!', type: 'success' });
      setTimeout(() => setSettingsMsg({ text: '', type: '' }), 4000);
    } else {
      setSettingsMsg({ text: res.message || 'Failed to update admin profile.', type: 'error' });
    }
  };

  const handleWhatsAppSubmit = async (e) => {
    e.preventDefault();
    setWhatsappMsg({ text: '', type: '' });

    try {
      const res = await fetch(`${API_BASE}/api/settings/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ whatsappNumber })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setWhatsappMsg({ text: 'WhatsApp setting updated successfully!', type: 'success' });
        setWhatsappNumber(data.whatsappNumber);
        setTimeout(() => setWhatsappMsg({ text: '', type: '' }), 4000);
      } else {
        setWhatsappMsg({ text: data.message || 'Failed to update WhatsApp setting.', type: 'error' });
      }
    } catch (err) {
      console.error('Error updating WhatsApp number:', err);
      setWhatsappMsg({ text: 'Server connection error.', type: 'error' });
    }
  };

  const handleDeleteCancelledOrder = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this cancelled order record?')) {
      try {
        const res = await fetch(`${API_BASE}/api/cancelled-orders/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCancelledOrders(prev => prev.filter(o => o.id !== id));
        } else {
          window.alert(data.message || 'Failed to delete cancelled order record.');
        }
      } catch (err) {
        console.error('Error deleting cancelled order:', err);
        window.alert('Server connection error.');
      }
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

  const unplacedOrders = orders.filter(o => o.status === 'Awaiting Payment' || o.status === 'Pending');
  const placedOrders = orders.filter(o => o.status === 'Placed');
  const shippedOrders = orders.filter(o => o.status === 'Shipped');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');

  let filteredOrders = [];
  if (orderFilter === 'unplaced') {
    filteredOrders = unplacedOrders;
  } else if (orderFilter === 'placed') {
    filteredOrders = placedOrders;
  } else if (orderFilter === 'shipped') {
    filteredOrders = shippedOrders;
  } else if (orderFilter === 'delivered') {
    filteredOrders = deliveredOrders;
  } else {
    filteredOrders = orders;
  }


  return (
    <div className="admin-dashboard container animate-fade-in" style={{ paddingTop: '120px', minHeight: '85vh', paddingBottom: '60px' }}>
      
      {/* Profile Summary Panel */}
      <div className="profile-header-panel glass-panel">
        <div className="profile-avatar-container">
          <div className="profile-avatar" style={{ background: 'radial-gradient(circle, var(--accent-gold) 0%, #b8860b 100%)' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="profile-info-block">
          <div className="profile-meta-top">
            <h1 className="profile-name">{user.name}</h1>
            <span className="profile-badge">
              <Shield size={12} style={{ marginRight: '4px' }} />
              System Admin
            </span>
          </div>
          <div className="profile-meta-grid">
            <div className="meta-item">
              <Mail size={16} className="meta-icon" />
              <span>{user.email}</span>
            </div>
            <div className="meta-item">
              <Calendar size={16} className="meta-icon" />
              <span>Registered Admin</span>
            </div>
          </div>
        </div>
        <div className="profile-header-actions">
          <button className="btn-outline logout-btn" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon-box"><Package size={24} color="var(--accent-gold)" /></div>
          <div className="metric-info">
            <span className="metric-label">Total Artworks</span>
            <span className="metric-value">{totalArtworks}</span>
          </div>
        </div>
        <div className="metric-card glass-panel">
          <div className="metric-icon-box"><TrendingUp size={24} color="#2ecc71" /></div>
          <div className="metric-info">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">₹{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="metric-card glass-panel">
          <div className="metric-icon-box"><Users size={24} color="#3498db" /></div>
          <div className="metric-info">
            <span className="metric-label">Registered Users</span>
            <span className="metric-value">{activeUsersCount}</span>
          </div>
        </div>
        <div className="metric-card glass-panel">
          <div className="metric-icon-box"><Clock size={24} color="#f1c40f" /></div>
          <div className="metric-info">
            <span className="metric-label">Awaiting Payment</span>
            <span className="metric-value">{awaitingPayment}</span>
          </div>
        </div>
        <div className="metric-card glass-panel">
          <div className="metric-icon-box"><CheckCircle size={24} color="#3498db" /></div>
          <div className="metric-info">
            <span className="metric-label">Paid / Placed</span>
            <span className="metric-value">{paidPlaced}</span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="dashboard-content-layout">
        
        {/* Left Sidebar Menu */}
        <aside className="dashboard-sidebar glass-panel">
          <button 
            className={`sidebar-link ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inventory'); setSelectedOrder(null); }}
          >
            <Package size={18} />
            <span>Catalog Stock</span>
            <span className="tab-count-badge">{totalArtworks}</span>
          </button>
          
          <button 
            className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
          >
            <ShoppingBag size={18} />
            <span>Customer Orders</span>
            {activeOrdersCount > 0 && <span className="tab-count-badge" style={{ backgroundColor: '#e74c3c', color: 'white' }}>{activeOrdersCount}</span>}
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); fetchUsers(); setSelectedOrder(null); }}
          >
            <Users size={18} />
            <span>User Accounts</span>
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analysis'); setSelectedOrder(null); }}
          >
            <TrendingUp size={18} />
            <span>Sales Analysis</span>
          </button>


          
          <button 
            className={`sidebar-link ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => { setActiveTab('cancelled'); setSelectedOrder(null); }}
          >
            <XCircle size={18} />
            <span>Cancelled Orders</span>
            {cancelledOrders.length > 0 && <span className="tab-count-badge" style={{ backgroundColor: '#e74c3c', color: 'white' }}>{cancelledOrders.length}</span>}
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setSelectedOrder(null); }}
          >
            <Lock size={18} />
            <span>Account Security</span>
          </button>
        </aside>

        {/* Right Dashboard Area */}
        <main className="dashboard-main-area glass-panel" style={{ minHeight: '600px' }}>
          
          {/* TAB 1: CATALOG STOCK (GRID & TABLE MODE) */}
          {activeTab === 'inventory' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="tab-title" style={{ margin: 0 }}>Gallery Stock Catalog</h2>
                  <p className="tab-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Add new pieces, change values, or feature masterpieces on the home page.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {/* Grid / List toggle */}
                  <div className="view-toggle-buttons" style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setInventoryView('grid')}
                      style={{ padding: '0.5rem', background: inventoryView === 'grid' ? 'var(--accent-gold)' : 'transparent', color: inventoryView === 'grid' ? '#000' : '#888' }}
                      title="Card Grid view"
                    >
                      <Grid size={16} />
                    </button>
                    <button 
                      onClick={() => setInventoryView('table')}
                      style={{ padding: '0.5rem', background: inventoryView === 'table' ? 'var(--accent-gold)' : 'transparent', color: inventoryView === 'table' ? '#000' : '#888' }}
                      title="Data Table view"
                    >
                      <List size={16} />
                    </button>
                  </div>
                  <button className="btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}>
                    <Plus size={16} />
                    Add Artwork
                  </button>
                </div>
              </div>

              {inventoryView === 'grid' ? (
                /* Card Grid view matching their original Profile page design! */
                <div className="products-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem', marginTop: '1.5rem' }}>
                  {artworks.map(art => (
                    <div key={art.id} className="profile-art-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem' }}>
                      <ProductCard product={art} />
                      <div className="profile-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button 
                          className="btn-outline" 
                          style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }} 
                          onClick={() => handleOpenEditModal(art)}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', borderColor: '#e74c3c', color: '#e74c3c', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }} 
                          onClick={() => handleDeleteArt(art.id, art.title)}
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Data Table view */
                <div className="table-responsive animate-fade-in" style={{ marginTop: '1rem' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Art Preview</th>
                        <th>Title</th>
                        <th>Artist</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th style={{ textAlign: 'center' }}>Featured</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artworks.map(art => (
                        <tr key={art.id}>
                          <td>
                            <img src={art.image} alt={art.title} className="table-img" />
                          </td>
                          <td className="table-highlight-text">{art.title}</td>
                          <td>{art.artist}</td>
                          <td style={{ textTransform: 'capitalize' }}>{art.category}</td>
                          <td className="table-price">₹{art.price.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="featured-toggle-btn"
                              onClick={() => updateArtwork(art.id, { featured: !art.featured })}
                            >
                              <Star size={18} fill={art.featured ? "var(--accent-gold)" : "none"} color={art.featured ? "var(--accent-gold)" : "#555"} />
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons-wrap">
                              <button className="action-icon-btn edit-btn" onClick={() => handleOpenEditModal(art)}>
                                <Edit2 size={16} />
                              </button>
                              <button className="action-icon-btn delete-btn" onClick={() => handleDeleteArt(art.id, art.title)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STORE ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="tab-pane">
              {selectedOrder ? (
                <div className="order-details-view animate-fade-in">
                  <button 
                    className="btn-outline" 
                    onClick={() => setSelectedOrder(null)} 
                    style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
                  >
                    ← Back to Orders List
                  </button>

                  <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h2 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '1.8rem', fontFamily: 'var(--font-heading)' }}>Order Details</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.3rem 0 0 0', fontSize: '0.9rem' }}>
                          Order ID: #{selectedOrder.id.substring(4)} | Date: {new Date(selectedOrder.date).toLocaleString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Change Status:</span>
                        <select 
                          value={selectedOrder.status}
                          onChange={(e) => {
                            updateOrderStatus(selectedOrder.id, e.target.value);
                            setSelectedOrder(prev => ({ ...prev, status: e.target.value }));
                          }}
                          className="status-dropdown"
                          data-status={selectedOrder.status}
                        >
                          <option value="Awaiting Payment">Awaiting Payment</option>
                          <option value="Placed">Placed (Paid)</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                      {/* Customer Info Card */}
                      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                          Customer Shipping & Contact
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem' }}>
                          <div><strong style={{ color: 'var(--text-secondary)' }}>Full Name:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{selectedOrder.customerName}</span></div>
                          <div><strong style={{ color: 'var(--text-secondary)' }}>Email Address:</strong> <span style={{ color: 'var(--text-primary)' }}>{selectedOrder.customerEmail}</span></div>
                          <div><strong style={{ color: 'var(--text-secondary)' }}>Phone Number:</strong> <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{selectedOrder.customerPhone || 'Not Provided'}</span></div>
                          <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.8rem', marginTop: '0.4rem' }}>
                            <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Delivery Address:</strong>
                            <span style={{ color: 'var(--text-primary)', display: 'block', lineHeight: '1.4' }}>
                              {selectedOrder.shippingAddress},<br />
                              {selectedOrder.city} - {selectedOrder.postalCode}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items Purchased Card */}
                      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <h3 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                          Purchased Artworks
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                          {selectedOrder.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                              <img src={item.image} alt={item.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} />
                              <div style={{ flex: 1 }}>
                                <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>{item.title}</h4>
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.8rem', textTransform: 'capitalize' }}>Category: {item.category}</p>
                              </div>
                              <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                ₹{item.price.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>Total Price Paid:</span>
                          <span style={{ fontSize: '1.35rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                            ₹{selectedOrder.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="tab-title">Store Sales & Orders</h2>
                  <p className="tab-subtitle">Fulfill sales and update tracking statuses (Awaiting Payment, Placed, Shipped, Delivered).</p>
                  
                  {/* Placed & Unplaced Filter Tabs */}
                  <div className="orders-filter-bar" style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setOrderFilter('unplaced')}
                      className={`btn-outline ${orderFilter === 'unplaced' ? 'active' : ''}`}
                      style={{ 
                        marginBottom: 0, 
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.9rem',
                        backgroundColor: orderFilter === 'unplaced' ? 'var(--accent-gold)' : 'transparent',
                        color: orderFilter === 'unplaced' ? '#000' : 'var(--accent-gold)',
                        border: '1px solid var(--accent-gold)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Unplaced Orders ({unplacedOrders.length})
                    </button>
                    <button 
                      onClick={() => setOrderFilter('placed')}
                      className={`btn-outline ${orderFilter === 'placed' ? 'active' : ''}`}
                      style={{ 
                        marginBottom: 0, 
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.9rem',
                        backgroundColor: orderFilter === 'placed' ? 'var(--accent-gold)' : 'transparent',
                        color: orderFilter === 'placed' ? '#000' : 'var(--accent-gold)',
                        border: '1px solid var(--accent-gold)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Placed Orders ({placedOrders.length})
                    </button>
                    <button 
                      onClick={() => setOrderFilter('shipped')}
                      className={`btn-outline ${orderFilter === 'shipped' ? 'active' : ''}`}
                      style={{ 
                        marginBottom: 0, 
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.9rem',
                        backgroundColor: orderFilter === 'shipped' ? 'var(--accent-gold)' : 'transparent',
                        color: orderFilter === 'shipped' ? '#000' : 'var(--accent-gold)',
                        border: '1px solid var(--accent-gold)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Shipped Orders ({shippedOrders.length})
                    </button>
                    <button 
                      onClick={() => setOrderFilter('delivered')}
                      className={`btn-outline ${orderFilter === 'delivered' ? 'active' : ''}`}
                      style={{ 
                        marginBottom: 0, 
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.9rem',
                        backgroundColor: orderFilter === 'delivered' ? 'var(--accent-gold)' : 'transparent',
                        color: orderFilter === 'delivered' ? '#000' : 'var(--accent-gold)',
                        border: '1px solid var(--accent-gold)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delivered Orders ({deliveredOrders.length})
                    </button>
                    <button 
                      onClick={() => setOrderFilter('all')}
                      className={`btn-outline ${orderFilter === 'all' ? 'active' : ''}`}
                      style={{ 
                        marginBottom: 0, 
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.9rem',
                        backgroundColor: orderFilter === 'all' ? 'var(--accent-gold)' : 'transparent',
                        color: orderFilter === 'all' ? '#000' : 'var(--accent-gold)',
                        border: '1px solid var(--accent-gold)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      All Orders ({orders.length})
                    </button>
                  </div>

                  {filteredOrders.length > 0 ? (
                    <div className="table-responsive animate-fade-in" style={{ marginTop: '1rem' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Customer Info</th>
                            <th>Purchased Art</th>
                            <th>Price Paid</th>
                            <th>Status Dropdown</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map(order => (
                            <tr key={order.id}>
                              <td className="table-highlight-text">#{order.id.substring(4)}</td>
                              <td>{new Date(order.date).toLocaleDateString()}</td>
                              <td>
                                <div><strong>{order.customerName}</strong></div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customerEmail}</div>
                                {order.customerPhone && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone: {order.customerPhone}</div>}
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.shippingAddress}, {order.city}</div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  {order.items.map(item => (
                                    <div key={item.id} style={{ fontSize: '0.85rem' }}>
                                      • {item.title} <span style={{ color: 'var(--text-secondary)' }}>({item.category})</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="table-price">₹{order.total.toLocaleString()}</td>
                              <td>
                                <select 
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className="status-dropdown"
                                  data-status={order.status}
                                >
                                  <option value="Awaiting Payment">Awaiting Payment</option>
                                  <option value="Placed">Placed (Paid)</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                </select>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className="action-buttons-wrap" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <button 
                                    className="btn-outline" 
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginBottom: 0, height: 'auto' }} 
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    Details
                                  </button>
                                  <button className="action-icon-btn delete-btn" onClick={() => handleDeleteOrder(order.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>
                      No {orderFilter === 'all' ? 'total' : orderFilter} orders registered in transaction history.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: REGISTERED USERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="tab-pane">
              <h2 className="tab-title">Registered Accounts</h2>
              <p className="tab-subtitle">Change account roles or delete database files.</p>
              
              <div className="table-responsive" style={{ marginTop: '1rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Account ID</th>
                      <th>Full Name</th>
                      <th>Email Address</th>
                      <th>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>#{u.id.substring(5) || u.id}</td>
                        <td className="table-highlight-text">
                          {u.name}
                          {u.role === 'admin' && (
                            <span className="role-badge admin-badge" style={{
                              marginLeft: '8px',
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(212, 175, 55, 0.15)',
                              color: 'var(--accent-gold)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              fontWeight: 'bold'
                            }}>Admin</span>
                          )}
                        </td>
                        <td>{u.email}</td>
                        <td>{u.joinedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {/* TAB 4: SALES & BUSINESS ANALYSIS */}
          {activeTab === 'analysis' && (
            <div className="tab-pane animate-fade-in">
              <h2 className="tab-title">Sales & Business Analysis</h2>
              <p className="tab-subtitle">In-depth overview of sales, revenue streams, and customer shopping behavior.</p>

              {/* Time-Series Period Filters */}
              <div className="analysis-filters glass-panel" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', marginBottom: '2rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Select Year</label>
                  <select 
                    value={analysisYear} 
                    onChange={(e) => setAnalysisYear(e.target.value)} 
                    className="status-dropdown" 
                    style={{ minWidth: '150px' }}
                  >
                    <option value="All">All Years</option>
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Select Month</label>
                  <select 
                    value={analysisMonth} 
                    onChange={(e) => setAnalysisMonth(e.target.value)} 
                    className="status-dropdown" 
                    style={{ minWidth: '150px' }}
                  >
                    <option value="All">All Months</option>
                    {monthsNameList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Filtered Orders</span>
                    <strong style={{ fontSize: '1.4rem', color: 'var(--accent-gold)' }}>{filteredAnalysisOrders.length}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Filtered Revenue</span>
                    <strong style={{ fontSize: '1.4rem', color: '#2ecc71' }}>₹{filteredAnalysisOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Year-Wise and Month-Wise Breakdown */}
              <div className="analysis-section" style={{ marginBottom: '3rem' }}>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Time-Series Sales Breakdown</h3>
                {yearsList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {yearsList.map(y => (
                      <div key={y.year} className="year-group-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.8rem', flexWrap: 'wrap', gap: '1rem' }}>
                          <h4 style={{ color: 'white', margin: 0, fontSize: '1.3rem' }}>Year: {y.year}</h4>
                          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', flexWrap: 'wrap' }}>
                            <span>Total Orders: <strong style={{ color: 'var(--accent-gold)' }}>{y.totalOrders}</strong></span>
                            <span>Annual Revenue: <strong style={{ color: '#2ecc71' }}>₹{y.totalIncome.toLocaleString()}</strong></span>
                          </div>
                        </div>

                        <div className="table-responsive">
                          <table className="admin-table" style={{ background: 'transparent' }}>
                            <thead>
                              <tr>
                                <th>Month</th>
                                <th style={{ textAlign: 'center' }}>Orders Placed</th>
                                <th style={{ textAlign: 'right' }}>Revenue Generated</th>
                              </tr>
                            </thead>
                            <tbody>
                              {y.sortedMonths.map(m => (
                                <tr key={m.monthName}>
                                  <td>{m.monthName}</td>
                                  <td style={{ textAlign: 'center', fontWeight: '500' }}>{m.totalOrders}</td>
                                  <td style={{ textAlign: 'right', color: 'var(--accent-gold)', fontWeight: 'bold' }}>₹{m.totalIncome.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No transaction data found for time-series breakdown.</p>
                )}
              </div>

              {/* Customer Purchasing Ledger ("Who all ordered") */}
              <div className="analysis-section" style={{ marginBottom: '3rem' }}>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Customer Purchasing Ledger (Who All Ordered)</h3>
                {filteredAnalysisOrders.length > 0 ? (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer Name</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...filteredAnalysisOrders]
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((order) => (
                            <tr key={order.id}>
                              <td className="table-highlight-text">#{order.id.substring(4)}</td>
                              <td>{order.customerName}</td>
                              <td style={{ textAlign: 'right', color: '#2ecc71', fontWeight: 'bold' }}>₹{order.total.toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No orders found for the selected period.</p>
                )}
              </div>

              {/* Product and Category Popularity */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
                {/* Popular Artworks */}
                <div className="analysis-section">
                  <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Popular Masterpieces</h3>
                  {topArtworks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {topArtworks.slice(0, 5).map(art => (
                        <div key={art.title} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', padding: '0.8rem', borderRadius: '6px' }}>
                          <img src={art.image} alt={art.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'white', fontWeight: '500' }}>{art.title}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Category: {art.category}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>{art.quantity} sold</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹{art.revenue.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No artwork sales registered.</p>
                  )}
                </div>

                {/* Popular Categories */}
                <div className="analysis-section">
                  <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Sales by Category</h3>
                  {topCategories.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {topCategories.map(cat => (
                        <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: '6px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: 'white', textTransform: 'capitalize', fontWeight: '500' }}>{cat.category}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantity: {cat.quantity} sold</span>
                          </div>
                          <div style={{ textAlign: 'right', color: '#2ecc71', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            ₹{cat.revenue.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No category sales registered.</p>
                  )}
                </div>
              </div>

            </div>
          )}



          {/* TAB 4.5: CANCELLED ORDERS VIEW */}
          {activeTab === 'cancelled' && (
            <div className="tab-pane animate-fade-in">
              <h2 className="tab-title">Cancelled Orders Log</h2>
              <p className="tab-subtitle">View requests for cancellations and refund statuses.</p>
              
              {cancelledOrders.length > 0 ? (
                <div className="table-responsive" style={{ marginTop: '1rem' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Cancellation Date</th>
                        <th>Customer Details</th>
                        <th>Acquired Art</th>
                        <th>Original Total</th>
                        <th>Refund Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledOrders.map(order => (
                        <tr key={order.id}>
                          <td className="table-highlight-text">#{order.originalOrderId.substring(4)}</td>
                          <td>{new Date(order.cancelledDate).toLocaleString()}</td>
                          <td>
                            <div><strong>{order.customerName}</strong></div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customerEmail}</div>
                            {order.customerPhone && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone: {order.customerPhone}</div>}
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.shippingAddress}, {order.city}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {order.items.map(item => (
                                <div key={item.id} style={{ fontSize: '0.85rem' }}>
                                  • {item.title} <span style={{ color: 'var(--text-secondary)' }}>({item.category})</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="table-price">₹{order.total.toLocaleString()}</td>
                          <td>
                            {order.paymentDone ? (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'rgba(231, 76, 60, 0.15)',
                                color: '#e74c3c',
                                border: '1px solid rgba(231, 76, 60, 0.3)',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}>
                                Payment Done (Refund Required)
                              </span>
                            ) : (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '0.8rem'
                              }}>
                                No Payment (No Refund)
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons-wrap" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button 
                                className="action-icon-btn delete-btn" 
                                onClick={() => handleDeleteCancelledOrder(order.id)}
                                title="Clear Cancelled Order Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>
                  No cancelled orders registered in transaction log history.
                </p>
              )}
            </div>
          )}

          {/* TAB 5: ADMIN ACCOUNT SECURITY */}
          {activeTab === 'settings' && (
            <div className="settings-view">
              <h2 className="tab-title">Admin Account Security</h2>
              <p className="tab-subtitle">Update administrator username, email address, or system passcode.</p>
              
              {settingsMsg.text && (
                <div className={`alert-box alert-${settingsMsg.type}`} style={{
                  padding: '1rem',
                  borderRadius: '4px',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  background: settingsMsg.type === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                  border: `1px solid ${settingsMsg.type === 'success' ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
                  color: settingsMsg.type === 'success' ? '#2ecc71' : '#e74c3c'
                }}>
                  {settingsMsg.text}
                </div>
              )}

              <form onSubmit={handleAdminProfileSubmit} className="settings-form">
                <div className="form-group">
                  <label>Administrator Name</label>
                  <input 
                    type="text" 
                    required 
                    value={adminName} 
                    onChange={(e) => setAdminName(e.target.value)} 
                  />
                </div>
                
                <div className="form-group">
                  <label>System Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={adminMail} 
                    onChange={(e) => setAdminMail(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>System Passcode</label>
                  <input 
                    type="password" 
                    required 
                    value={adminPass} 
                    onChange={(e) => setAdminPass(e.target.value)} 
                  />
                </div>

                <button type="submit" className="btn-primary submit-profile-btn" style={{ marginTop: '1rem' }}>
                  Update Admin Profile
                </button>
              </form>

              <hr style={{ margin: '3rem 0', borderColor: 'var(--border-subtle)' }} />

              <h2 className="tab-title">WhatsApp Integration Settings</h2>
              <p className="tab-subtitle">Update global phone number used to receive payment confirmation requests.</p>

              {whatsappMsg.text && (
                <div className={`alert-box alert-${whatsappMsg.type}`} style={{
                  padding: '1rem',
                  borderRadius: '4px',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  background: whatsappMsg.type === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                  border: `1px solid ${whatsappMsg.type === 'success' ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
                  color: whatsappMsg.type === 'success' ? '#2ecc71' : '#e74c3c'
                }}>
                  {whatsappMsg.text}
                </div>
              )}

              <form onSubmit={handleWhatsAppSubmit} className="settings-form">
                <div className="form-group">
                  <label>Active WhatsApp Number</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 9019832399" 
                    value={whatsappNumber} 
                    onChange={(e) => setWhatsappNumber(e.target.value)} 
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Ensure this number is configured to receive and handle user messages on checkout completion. Do not include country code prefix (e.g. 91) or special characters.
                  </span>
                </div>

                <button type="submit" className="btn-primary submit-profile-btn" style={{ marginTop: '1rem' }}>
                  Update WhatsApp Setting
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Edit/Add Artwork Modal overlay */}
      {isArtModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass-panel admin-modal">
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>{editingArt ? 'Modify Catalog Masterpiece' : 'Catalog New Masterpiece'}</h2>
            <form onSubmit={handleArtSubmit} className="admin-modal-form">
              <div className="form-group">
                <label>Artwork Title *</label>
                <input type="text" required placeholder="e.g. Echoes of Silence" value={artTitle} onChange={(e) => setArtTitle(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Artist Name *</label>
                  <input type="text" required placeholder="e.g. Rahul Verma" value={artArtist} onChange={(e) => setArtArtist(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Price (INR) *</label>
                  <input type="number" required placeholder="e.g. 22000" value={artPrice} onChange={(e) => setArtPrice(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select value={artCategory} onChange={(e) => { setArtCategory(e.target.value); setArtSubCategory(''); }} style={{ width: '100%' }}>
                    <option value="paintings">Paintings</option>
                    <option value="sketch">Sketch</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Sub Category (optional)</label>
                  <input
                    type="text"
                    placeholder={artCategory === 'paintings' ? 'e.g. Scenery, Portrait...' : 'e.g. Charcoal, Pencil...'}
                    value={artSubCategory}
                    onChange={(e) => setArtSubCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Artwork Image</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem' }}>
                  
                  {/* Option A: Upload Local File */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Upload Local Image File:</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>— OR —</div>

                  {/* Option B: Provide Image URL */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Provide Image URL:</span>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/..." 
                      value={artImage && artImage.startsWith('data:') ? '' : artImage} 
                      onChange={(e) => setArtImage(e.target.value)} 
                    />
                  </div>

                  {/* Optional Image Thumbnail Preview */}
                  {artImage && (
                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.8rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Selected Image Preview:</span>
                      <img 
                        src={artImage} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '120px', 
                          maxHeight: '120px', 
                          objectFit: 'cover',
                          borderRadius: '4px', 
                          border: '1px solid var(--accent-gold)' 
                        }} 
                      />
                    </div>
                  )}

                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea required rows="3" placeholder="Describe the art meaning..." value={artDescription} onChange={(e) => setArtDescription(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', padding: '0.8rem' }} />
              </div>

              <div className="form-group">
                <label>How It's Made *</label>
                <textarea required rows="2" placeholder="Materials, techniques..." value={artHowMade} onChange={(e) => setArtHowMade(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', padding: '0.8rem' }} />
              </div>

              <div className="form-group checkbox-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input type="checkbox" id="featured" checked={artFeatured} onChange={(e) => setArtFeatured(e.target.checked)} />
                <label htmlFor="featured" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Feature this artwork on the home page</label>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingArt ? 'Save Modifications' : 'Publish Artwork'}</button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setIsArtModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
