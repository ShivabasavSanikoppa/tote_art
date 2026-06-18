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

        <div className="footer-social">
          <h3>Connect</h3>
          <div className="social-icons">
            <a href="#"><Camera /></a>
            <a href="#"><Globe /></a>
            <a href="#"><Mail /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Tote Art Gallery. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
