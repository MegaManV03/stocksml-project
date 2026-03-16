// Layout.jsx - SIMPLIFIED AND CORRECTED
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, 
  faTimes, 
  faChartLine, 
  faUser, 
  faHome, 
  faSignOutAlt, 
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import './Layout.css';
import logo from './logo.png';
import { login, register, logout, getAccessToken, getUserData, getRefreshToken,refreshAccessToken   } from '../services/auth';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    username: '',
    role: 'guest'
  });
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Replace ALL your useEffect code with this SINGLE one:
  useEffect(() => {
    // 1. Check auth status
    const checkAuth = () => {
      const token = getAccessToken();
      const userData = getUserData();
      
      if (token && userData) {
        setAuthState({
          isLoggedIn: true,
          username: userData.username || 'User',
          role: userData.role || 'member'
        });
      } else {
        setAuthState({ 
          isLoggedIn: false, 
          username: '', 
          role: 'guest' 
        });
      }
    };
    
    // Initial check
    checkAuth();
    
    // 2. Setup auto token refresh
    const setupAutoRefresh = () => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();
      
      if (!token || !refreshToken) return null;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        const timeUntilExpiry = expiresAt - Date.now();
        
        if (timeUntilExpiry < 5 * 60 * 1000) {
          refreshAccessToken(refreshToken).catch(console.error);
        }
        
        const refreshTime = Math.max(timeUntilExpiry - 60 * 1000, 1000);
        const timer = setTimeout(() => {
          refreshAccessToken(refreshToken).catch(console.error);
        }, refreshTime);
        
        return timer;
      } catch (error) {
        console.error('Token refresh setup failed:', error);
        return null;
      }
    };
    
    let refreshTimer = setupAutoRefresh();
    
    // 3. Handle storage changes (logout)
    const handleStorageChange = () => {
      checkAuth();
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setupAutoRefresh();
    };

    // Listens for localStorage changes from other tabs and logs out user when token is removed
    window.addEventListener('storage', (event) => {
      // Ignore if this tab triggered the event
      if (event.storageArea === localStorage && 
          event.key === TOKEN_KEY && 
          event.newValue === null) {
        // Only logout if it's a different tab
        if (!event.isTrusted) return; // or use a custom flag
        clearAuthTokens();
        window.location.href = '/';
      }
    });
    
    window.addEventListener('storage', handleStorageChange);
    
    // 4. Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);
  
  const checkAuthStatus = () => {
    const token = getAccessToken();
    const userData = getUserData();
    
    if (token && userData) {
      setAuthState({
        isLoggedIn: true,
        username: userData.username || 'User',
        role: userData.role || 'member'
      });
    } else {
      setAuthState({ 
        isLoggedIn: false, 
        username: '', 
        role: 'guest' 
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMessage('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    // Validation
    if (isRegisterMode) {
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
    }
    
    try {
      if (isRegisterMode) {
        // Use auth service for registration
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        
        alert('Registration successful! Please login.');
        setIsRegisterMode(false);
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        
      } else {
        // Use auth service for login
        const response = await login(formData.username, formData.password);
        
        // Update auth state
        setAuthState({
          isLoggedIn: true,
          username: formData.username,
          role: response.role
        });
        
        closeModal();
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      }
      
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout(); // This clears tokens and redirects to home
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setErrorMessage('');
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <Link to="/" className="logo-link">
              <span className="logo-text">Kristupas Velžys Project</span>
            </Link>
          </div>  
          
          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
               Home
            </Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            {/* Show Control Panel only for admin */}
            {authState.isLoggedIn && authState.role === 'admin' && (
              <Link to="/controlPanel" onClick={() => setIsMenuOpen(false)} className="admin-btn">
                Control Panel
              </Link>
            )}
            
            {!authState.isLoggedIn ? (
            <>
              <span style={{ color: '#a1a1a1', fontSize: '24px', fontWeight: '300', marginRight: '0.5rem' }}>|</span>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <button className="login-btn" onClick={() => {
                  setIsRegisterMode(false);
                  openModal();
                }}>
                  Login
                </button>
                <button className="signup-btn" onClick={() => {
                  setIsRegisterMode(true);
                  openModal();
                }}>
                  Sign Up
                </button>
              </div>
            </>
          ) : (
            <div className="user-info">
              <Link to="/account" className="user-btn" title="My Account">
                <span className="username">{authState.username}</span>
              </Link>
            </div>
          )}
          </nav>

          {/* Hamburger Mobile Button */}
          <button className="hamburger" onClick={toggleMenu}>
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/about" onClick={() => setIsMenuOpen(false)}>
             About
          </Link>
          
          {/* Show Control Panel only for admin */}
          {authState.isLoggedIn && authState.role === 'admin' && (
            <Link to="/controlPanel" onClick={() => setIsMenuOpen(false)} className="mobile-admin-btn">
              Control Panel
            </Link>
          )}
          
          {authState.isLoggedIn ? (
            <>
              <Link to="/account" className="mobile-login-btn" onClick={() => setIsMenuOpen(false)}>
                My Account
              </Link>
              <button onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }} className="mobile-logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="mobile-login-btn" onClick={() => {
                  setIsRegisterMode(false);
                  openModal();
                  setIsMenuOpen(false);
                }}>
                  Login
                </button>
                <button className="mobile-signup-btn" onClick={() => {
                  setIsRegisterMode(true);
                  openModal();
                  setIsMenuOpen(false);
                }}>
                  Sign Up
              </button>
            </>
          )}
        </nav>
      </header>

      {/* CONTENT AREA */}
      <main className="content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* FOOTER */}
    <footer className="footer">
      <div className="footer-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem' }}>© 2025 Stock Analysis Platform | Made by Kristupas</p>
        <span className="auth-status" style={{ color: '#ffffff', fontSize: '1.1rem' }}>
          Status: {authState.isLoggedIn ? 
            `Logged in as ${authState.username} (${authState.role})` : 
            'Guest mode'}
        </span>
      </div>
    </footer>

      {/* LOGIN/REGISTER MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            <div className="modal-tabs">
              <button 
                className={`tab-btn ${!isRegisterMode ? 'active' : ''}`}
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMessage('');
                }}
              >
                Login
              </button>
              <button 
                className={`tab-btn ${isRegisterMode ? 'active' : ''}`}
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMessage('');
                }}
              >
                Register
              </button>
            </div>
            
            <h2>{isRegisterMode ? 'Create Account' : 'Login'}</h2>
            
            {errorMessage && (
              <div className="error-message">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                {errorMessage}
              </div>
            )}
            
            <form className="modal-form" onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <input 
                  type="text" 
                  name="username"
                  placeholder="Username" 
                  required 
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              
              {isRegisterMode && (
                <div className="form-group">
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Email" 
                    required 
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              <div className="form-group">
                <input 
                  type="password" 
                  name="password"
                  placeholder="Password" 
                  required 
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              
              {isRegisterMode && (
                <div className="form-group">
                  <input 
                    type="password" 
                    name="confirmPassword"
                    placeholder="Confirm Password" 
                    required 
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              {!isRegisterMode && (
                <div className="forgot-password">
                  <button 
                    type="button"
                    className="forgot-btn"
                    onClick={() => {
                      closeModal();
                      navigate('/account');
                    }}
                  >
                    Change Password
                  </button>
                </div>
              )}
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (isRegisterMode ? 'Create Account' : 'Login')}
              </button>
              
              
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;