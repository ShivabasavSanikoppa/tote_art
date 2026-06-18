import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const res = await login(email, password);
      if (res.success) {
        navigate(fromPath, { replace: true });
      } else {
        setError(res.message);
      }
    } else {
      // Regular signup is always a customer ('user')
      const res = await register(name, email, password, 'user');
      if (res.success) {
        navigate(fromPath, { replace: true });
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="login-page container animate-fade-in" style={{ paddingTop: '120px', paddingBottom: '50px' }}>
      <div className="login-container glass-panel">
        <div className="login-header">
          <h1 className="section-title" style={{ marginBottom: '1rem' }}>
            {isLogin ? 'Welcome Back' : 'Join Tote Art Gallery'}
          </h1>
          <p className="login-subtitle">
            {isLogin ? 'Enter your details to access your collection.' : 'Create an account to curate your premium art collection.'}
          </p>
        </div>

        <div className="login-toggle">
          <button 
            type="button"
            className={`toggle-btn ${isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button 
            type="button"
            className={`toggle-btn ${!isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="login-error" style={{ color: '#e74c3c', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', padding: '0.8rem', background: 'rgba(231,76,60,0.1)', borderRadius: '4px', border: '1px solid rgba(231,76,60,0.2)' }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
          )}
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
            <label>Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn-primary login-submit-btn" style={{ marginTop: '1rem' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
