import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page container animate-fade-in" style={{ paddingTop: '120px', minHeight: '80vh', paddingBottom: '60px' }}>
      <div className="glass-panel about-card" style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem)', position: 'relative', overflow: 'hidden' }}>
        <div className="about-glow" />
        <h1 className="section-title" style={{ color: 'var(--accent-gold)', marginBottom: '2rem', fontSize: 'clamp(2rem, 6vw, 3rem)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>About Us</h1>
        
        <div className="about-content" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.2rem)', lineHeight: '1.8', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'justify' }}>
          <p style={{ fontWeight: '700', color: 'var(--accent-gold)', fontSize: 'clamp(1.25rem, 4.5vw, 1.6rem)', margin: 0, textAlign: 'left' }}>
            Welcome to Tote Art Gallery 🎨
          </p>
          <p style={{ margin: 0 }}>
            This space is a reflection of my passion for art and creativity. Every painting you see here is handmade with care, using colors and ideas inspired by nature, emotions, and everyday beauty.
          </p>
          <p style={{ margin: 0 }}>
            I started this journey to share my artwork with others and bring a little bit of art into your homes. Each piece is unique, created with patience and love.
          </p>
          <p style={{ fontWeight: '700', color: 'var(--accent-gold)', margin: '1rem 0 0 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', textAlign: 'left' }}>
            Thank you for supporting small artists 💛
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
