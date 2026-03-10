import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../services/api';
import './Account.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [changePassword, setChangePassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  
  useEffect(() => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (err) {
      setError('Error loading user data');
    }
    
    setLoading(false);
  }, [navigate]);
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (changePassword.new !== changePassword.confirm) {
      setError('New passwords do not match');
      return;
    }
    
    if (changePassword.new.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    
    try {
      await API.patch('/api/v1/users/me/password', {
        current_password: changePassword.current,
        new_password: changePassword.new
      });
      
      setSuccess('Password changed successfully');
      setChangePassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }
    
    if (!window.confirm('Are you sure? This will permanently delete your account!')) {
      return;
    }
    
    try {
      await API.delete('/api/v1/users/me');
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('storage'));
      alert('Account deleted successfully');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete account');
    }
  };
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        navigate('/');
    }
    };
  
  if (loading) return <div className="loading">Loading account...</div>;
  if (!user) return <div className="error">Please login first</div>;
  
  return (
    <div className="account-page">
      <div className="account-header">
        <h1>Account Settings</h1>
        <p>Manage your account</p>
      </div>
      
      
      <div className="account-section">
        <h2>Logout</h2>
        <p>Sign out of your account</p>
        <button onClick={handleLogout} className="btn logout-btn">
          Logout
        </button>
      </div>
      
      <div className="account-section">
        <h2>Change Password</h2>
        {success && <div className="success">{success}</div>}
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handlePasswordChange} className="password-form">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={changePassword.current}
              onChange={(e) => setChangePassword({
                ...changePassword,
                current: e.target.value
              })}
              required
              placeholder="Current password"
            />
          </div>
          
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={changePassword.new}
              onChange={(e) => setChangePassword({
                ...changePassword,
                new: e.target.value
              })}
              required
              placeholder="New password (min 6 chars)"
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={changePassword.confirm}
              onChange={(e) => setChangePassword({
                ...changePassword,
                confirm: e.target.value
              })}
              required
              placeholder="Confirm new password"
            />
          </div>
          
          <button type="submit" className="btn primary-btn">
            Change Password
          </button>
        </form>
      </div>
      
      <div className="account-section danger-section">
        <h2>Delete Account</h2>
        <p className="warning">
          This will permanently delete your account and all your data.
        </p>
        
        <div className="delete-form">
          <div className="form-group">
            <label>Type DELETE to confirm:</label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="delete-input"
            />
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE'}
            className="btn delete-btn"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}