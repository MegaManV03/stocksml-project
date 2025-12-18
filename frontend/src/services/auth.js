// src/services/auth.js - FIXED EXPORTS
import axios from 'axios';

// Use Vite env var if provided, otherwise call same origin (works on Render)
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Token management constants
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

// Token storage functions
export const setAuthTokens = (accessToken, refreshToken, userData) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
  window.dispatchEvent(new Event('storage'));
};

// ✅ ADD THESE EXPORTS
export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const getUserData = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const clearAuthTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('storage'));
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiry;
  } catch {
    return true;
  }
};

// Verify token on app start
export const verifyTokenOnStart = async () => {
  const token = getAccessToken();
  const userData = getUserData();
  
  if (!token || !userData) {
    clearAuthTokens();
    return null;
  }
  
  if (isTokenExpired(token)) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      return null;
    }
    
    try {
      await refreshAccessToken(refreshToken);
      return getUserData();
    } catch {
      clearAuthTokens();
      return null;
    }
  }
  
  return userData;
};

// Refresh access token (internal function)
export const refreshAccessToken = async (refreshToken) => {
    try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken
    });
    
    const { access_token } = response.data;
    localStorage.setItem(TOKEN_KEY, access_token);
    return access_token;
  } catch (error) {
    throw error;
  }
};

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const newToken = await refreshAccessToken(refreshToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          clearAuthTokens();
          window.location.href = '/';
        }
      } else {
        clearAuthTokens();
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication functions
export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await axios.post(`${API_URL}/auth/login`, formData);
  const { access_token, refresh_token, role } = response.data;
  
  setAuthTokens(access_token, refresh_token, {
    username,
    role
  });
  
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = () => {
  // Clear ALL tokens and user data
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Dispatch storage event so Layout.jsx knows about the change
  window.dispatchEvent(new Event('storage'));
  
  // Redirect to home page
  window.location.href = '/';
};

// Export the configured axios instance
export default api;