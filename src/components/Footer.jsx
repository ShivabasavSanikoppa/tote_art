import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import API_BASE from '../api';
import './Footer.css';

const Footer = () => {
  const [customerCarePhone, setCustomerCarePhone] = useState('9019832399');
  const [customerCareEmail, setCustomerCareEmail] = useState('care@toteart.com');

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/contact`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.customerCarePhone) setCustomerCarePhone(data.customerCarePhone);
            if (data.customerCareEmail) setCustomerCareEmail(data.customerCareEmail);
          }
        }
      } catch (err) {
        console.error('Failed to fetch footer contact settings:', err);
      }
    };
    fetchContactSettings();
  }, []);

  return (
    <footer className="footer glass-panel">
      <div className="container footer-container">
        <div className="footer-brand">
          <h2>TOTE ART GALLERY</h2>
          <p>Curated premium art from exceptional artists. Elevate your space with authentic paintings and sketches.</p>
        </div>
        
        <div className="footer-links">
          <h3>Explore</h3>
          <Link to="/category/paintings">Paintings</Link>
          <Link to="/category/sketch">Sketch</Link>
        </div>

        <div className="footer-links">
          <h3>Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={14} style={{ color: 'var(--accent-gold)' }} />
              <span>{customerCarePhone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={14} style={{ color: 'var(--accent-gold)' }} />
              <a href={`mailto:${customerCareEmail}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent-gold)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>{customerCareEmail}</a>
            </div>
          </div>
        </div>

        <div className="footer-policies">
          <h3>Store Policies</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: '1.4' }}>
            <li>🚫 <strong>No Returns:</strong> Once bought, items cannot be returned.</li>
            <li>⏱️ <strong>Cancellation:</strong> Within 24 hours of placement. Paid orders refunded within 8 hours.</li>
            <li>📲 <strong>Confirmation:</strong> Upload payment screenshot during checkout. Order confirmed within 8 hours.</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Tote Art Gallery. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
