import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, newPassword, confirmPassword } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const trimmedEmail = email.trim();
    const trimmedNewPassword = newPassword.trim();
    
    if (trimmedNewPassword !== confirmPassword.trim()) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    
    console.log('Attempting password reset for:', trimmedEmail);

    try {
      await axios.post('/api/auth/forgot-password', { email: trimmedEmail, newPassword: trimmedNewPassword });
      setMessage('Password reset successful');
      console.log('Password reset successful');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful' } });
      }, 2000);
    } catch (err) {
      console.error('Reset Error:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Forgot Password</h2>
        <p className="auth-subtitle">Enter your email and a new password to reset it.</p>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              name="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={onChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input 
              type="password" 
              name="newPassword" 
              placeholder="Enter new password" 
              value={newPassword}
              onChange={onChange}
              required 
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="Confirm new password" 
              value={confirmPassword}
              onChange={onChange}
              required 
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="auth-footer">
          Remember your password? <Link to="/login" style={{ color: '#2563eb', fontWeight: 'bold' }}>Login</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
