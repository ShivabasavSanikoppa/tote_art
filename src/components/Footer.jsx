import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Globe, Mail } from 'lucide-react';
import './Footer.css';

const Footer = () => {
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
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/privacy">Privacy Policy</Link>
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
