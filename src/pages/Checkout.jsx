import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import API_BASE from '../api';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  }

  const { addOrder } = useOrders();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState(user.name ? user.name.split(' ')[0] : '');
  const [lastName, setLastName] = useState(user.name ? user.name.split(' ').slice(1).join(' ') : '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState('');

  // WhatsApp and Payment settings configuration
  const [whatsappNumber, setWhatsappNumber] = useState('9019832399');
  const whatsappRef = useRef('9019832399'); // ref always has latest value
  const [upiId, setUpiId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/whatsapp`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.whatsappNumber) {
            setWhatsappNumber(data.whatsappNumber);
            whatsappRef.current = data.whatsappNumber;
          }
        }
      } catch (err) {
        console.error('Failed to fetch WhatsApp number:', err);
      }
    };

    const fetchPaymentSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/payment`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUpiId(data.upiId || '');
            setQrCode(data.qrCode || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment settings:', err);
      }
    };

    fetchWhatsAppNumber();
    fetchPaymentSettings();
  }, []);

  const total = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Expand items by quantity so each unit is a separate line (or keep quantity field)
    const orderData = {
      userId: user.id,
      customerName: `${firstName} ${lastName}`,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: address,
      city: city,
      postalCode: postalCode,
      items: cartItems.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        category: item.category,
        quantity: item.quantity || 1
      })),
      total: total
    };

    // Add order to database
    const res = await addOrder(orderData);
    if (res && res.success) {
      setCreatedOrder(res.order);
      // Fetch latest WhatsApp number and payment settings fresh at order completion
      try {
        const wpRes = await fetch(`${API_BASE}/api/settings/whatsapp`);
        if (wpRes.ok) {
          const wpData = await wpRes.json();
          if (wpData.success && wpData.whatsappNumber) {
            setWhatsappNumber(wpData.whatsappNumber);
            whatsappRef.current = wpData.whatsappNumber;
          }
        }
      } catch (e) {
        console.warn('Could not refresh WhatsApp number at checkout');
      }

      try {
        const payRes = await fetch(`${API_BASE}/api/settings/payment`);
        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.success) {
            setUpiId(payData.upiId || '');
            setQrCode(payData.qrCode || '');
          }
        }
      } catch (e) {
        console.warn('Could not refresh payment settings at checkout');
      }

      // Clear shopping cart
      clearCart();
      setIsSuccess(true);
    } else {
      setError(res?.message || 'Failed to place order.');
    }
  };

  if (cartItems.length === 0 && !isSuccess) {
    return (
      <div className="checkout-page container text-center" style={{ paddingTop: '150px', minHeight: '60vh' }}>
        <h2>Your Cart is Empty</h2>
        <p>You need to add items to your cart before you can checkout.</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '2rem' }}>Browse Art</Link>
      </div>
    );
  }

  if (isSuccess) {
    const messageText = `Hi! I have placed an order on Tote Art and completed the payment.
Here are my order details:
- Order ID: #${createdOrder?.id?.substring(4) || ''}
- Name: ${createdOrder?.customerName || ''}
- Total Amount: ₹${createdOrder?.total?.toLocaleString() || ''}

I have attached the screenshot of my payment below. Please confirm my order!`;

    const whatsappUrl = `https://wa.me/91${whatsappRef.current}?text=${encodeURIComponent(messageText)}`;

    return (
      <div className="checkout-page container text-center animate-fade-in" style={{ paddingTop: '120px', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: 'clamp(1.5rem, 5vw, 3rem)', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-gold)', fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', marginBottom: '1rem' }}>Order Registered!</h2>
          <p style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your order has been registered and is currently <strong style={{ color: '#f1c40f' }}>Awaiting Payment</strong>.
          </p>

          {/* UPI and QR code Payment Box */}
          <div className="upi-instructions-box" style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px dashed var(--accent-gold)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Payment Method: Online UPI</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1rem' }}>
              Please scan the QR code or pay to the UPI ID below to complete your payment of <strong>₹{createdOrder?.total?.toLocaleString() || ''}</strong>.
            </p>

            {/* QR Code */}
            {qrCode ? (
              <div style={{
                margin: '0.5rem auto 1.5rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '12px',
                display: 'inline-block',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                maxWidth: '200px'
              }}>
                <img 
                  src={qrCode} 
                  alt="UPI QR Code" 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    display: 'block',
                    borderRadius: '8px'
                  }} 
                />
              </div>
            ) : (
              <div style={{
                margin: '0.5rem auto 1.5rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: '12px',
                maxWidth: '200px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1',
                width: '100%'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>QR Code Not Configured</span>
              </div>
            )}

            {/* UPI ID copyable */}
            {upiId ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>UPI ID</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '30px',
                  padding: '0.4rem 0.4rem 0.4rem 1.2rem',
                  gap: '0.8rem',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}>
                  <code style={{ 
                    color: 'var(--accent-gold)', 
                    fontSize: '0.95rem', 
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    userSelect: 'all'
                  }}>{upiId}</code>
                  <button 
                    type="button" 
                    onClick={handleCopyUpi} 
                    style={{
                      background: copied ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.1)',
                      color: copied ? 'black' : 'white',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '0.4rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>UPI ID Not Configured</p>
            )}
          </div>

          {/* Store Policies */}
          <div className="order-summary-card" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.95rem' }}>
            <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Important Store Policies</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <li><strong>No Return Policy:</strong> Once bought, items cannot be returned.</li>
              <li><strong>Cancellation:</strong> You can cancel your order within 24 hours of placement. If payment is already done, we will refund you within 8 hours. Cancellations cannot be made after 24 hours.</li>
              <li><strong>WhatsApp Confirmation:</strong> After payment, you must send a screenshot of the payment receipt to our WhatsApp number. Your order will be placed/confirmed within 8 hours of receiving the screenshot.</li>
            </ul>
          </div>

          {/* Order Details */}
          <div className="order-summary-card" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.95rem' }}>
            <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Order Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Order ID</span><span style={{ color: 'white', fontWeight: 'bold', wordBreak: 'break-all' }}>#{createdOrder?.id?.substring(4) || ''}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Amount</span><span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>₹{createdOrder?.total?.toLocaleString() || ''}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Customer Name</span><span style={{ color: 'white' }}>{createdOrder?.customerName || ''}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Shipping Address</span><span style={{ color: 'white' }}>{createdOrder?.shippingAddress || ''}, {createdOrder?.city || ''}</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.8rem', 
                padding: '1.2rem', 
                fontSize: '1.1rem',
                backgroundColor: '#25D366',
                color: 'white',
                borderColor: '#25D366',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.015 14.07 1 11.997 1 6.556 1 2.13 5.372 2.126 9.8c-.001 1.696.442 3.35 1.284 4.803l-.99 3.613 3.72-.962zm10.933-5.568c-.267-.133-1.579-.78-1.823-.867-.243-.088-.42-.133-.596.133-.176.265-.681.867-.834 1.044-.153.177-.306.199-.573.066-.268-.133-1.13-.418-2.152-1.332-.796-.71-1.333-1.586-1.49-1.852-.156-.266-.017-.41.117-.542.121-.12.267-.31.401-.466.134-.155.178-.266.267-.442.089-.177.044-.332-.022-.466-.067-.133-.596-1.438-.816-1.97-.215-.518-.43-.448-.596-.456-.153-.005-.33-.006-.507-.006-.176 0-.464.066-.707.332-.243.266-.927.907-.927 2.212s.949 2.565 1.082 2.743c.133.177 1.867 2.85 4.522 3.998.632.273 1.125.436 1.509.558.635.2 1.21.171 1.666.103.508-.076 1.579-.646 1.8-.1.222-.546.222-1.018.156-1.107-.067-.089-.244-.133-.51-.266z"/>
              </svg>
              Send Payment Screenshot on WhatsApp
            </a>
            
            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
              <Link to="/profile" className="btn-outline" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                View My Orders
              </Link>
              <Link to="/" className="btn-outline" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page container" style={{ paddingTop: '120px' }}>
      <h1 className="section-title">Secure Checkout</h1>

      <div className="checkout-layout">
        <div className="checkout-form-section glass-panel">
          <h2>Billing & Shipping Information</h2>
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="John" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Doe" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="john@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Phone Number * (Compulsory)</label>
              <input 
                type="tel" 
                required 
                placeholder="e.g. 9019832399" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Shipping Address</label>
              <input 
                type="text" 
                required 
                placeholder="123 Art Avenue" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Mumbai" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input 
                  type="text" 
                  required 
                  placeholder="400001" 
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            <h2 style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>Payment Method</h2>
            
            <div className="upi-info-card" style={{
              background: 'rgba(212, 175, 55, 0.05)',
              border: '1px dashed var(--accent-gold)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', marginTop: 0, marginBottom: '0.8rem' }}>Payment Method & Store Policies</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '0.8rem' }}>
                Only Online UPI payment is supported. Once you place the order, you will be shown our UPI ID and QR code to complete your payment, after which you must send the payment screenshot to us via WhatsApp.
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>No Return Policy:</strong> Once bought, items cannot be returned.</li>
                <li><strong>Cancellation Policy:</strong> You can cancel your order within 24 hours of placement. If payment is already done, we will refund you within 8 hours. No cancellations allowed after 24 hours.</li>
                <li><strong>WhatsApp Confirmation:</strong> After paying, you must manually send a screenshot of the payment receipt to our WhatsApp number (<strong>+91 {whatsappNumber}</strong>). Your order will be processed and confirmed within 8 hours of receiving the screenshot.</li>
              </ul>
            </div>

            {error && (
              <div className="alert-error" style={{
                color: '#e74c3c',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                padding: '0.8rem',
                background: 'rgba(231,76,60,0.1)',
                borderRadius: '4px',
                border: '1px solid rgba(231,76,60,0.2)'
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary place-order-btn">Place Order & Message on WhatsApp</button>
          </form>
        </div>

        <div className="checkout-summary-section glass-panel">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {cartItems.map((item, index) => (
              <div key={index} className="summary-item">
                <img src={item.image} alt={item.title} className="summary-item-image" />
                <div className="summary-item-info">
                  <h4>{item.title}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</h4>
                  <p>₹{(item.price * (item.quantity || 1)).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Secure Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
