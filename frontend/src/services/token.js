// src/services/auth.js
import axios from 'axios';
import {
  setAuthTokens,
  clearAuthTokens,
  getRefreshToken,
  getAccessToken,
  isTokenExpired,
  getUserData,
  refreshAccessToken as authRefreshAccessToken
} from './auth';

// Use configured API URL or same origin so deployed frontend hits the live backend
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = getAccessToken();

    // Check if token needs refresh BEFORE request (if expired)
    if (token && isTokenExpired(token)) {
      console.log('🔄 Token needs refresh, attempting...');
      try {
        const newToken = await authRefreshAccessToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        clearAuthTokens();
        window.location.href = '/';
        return Promise.reject(error);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        clearTokens();
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// Refresh token function
export const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
      // Delegate refresh to auth's helper so storage is consistent
      const newToken = await authRefreshAccessToken(refreshToken);
      return newToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
      clearAuthTokens();
    throw error;
  }
};

// Login function - UPDATED
export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await axios.post(`${API_URL}/auth/login`, formData);
  const { access_token, refresh_token, role } = response.data;

  // Store tokens using auth helper
  setAuthTokens(access_token, refresh_token, { username, role });
  
  // Trigger auth change event
  window.dispatchEvent(new Event('storage'));
  
  return response.data;
};

// Register function
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Logout function
export const logout = () => {
  clearAuthTokens();
  window.location.href = '/';
};

// Verify token on app start
export const verifyTokenOnStart = async () => {
  const token = getAccessToken();
  if (!token) return null;
  
  try {
    // Check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    
    if (Date.now() >= expiry) {
      // Try to refresh
      if (getRefreshToken()) {
        await refreshAccessToken();
      } else {
        clearTokens();
        return null;
      }
    }
    
    return getUserData();
  } catch (error) {
    console.error('Token verification failed:', error);
    clearTokens();
    return null;
  }
};

export default api;