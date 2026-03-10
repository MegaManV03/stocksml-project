// src/services/auth.js - atnaujinta su refresh
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - prideda token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - automatiškai atnaujina token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Jei 401 error (neautorizuota) IR dar nebandoma refreshinti
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Bandome atnaujinti tokeną
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const newToken = response.data.access_token;
          localStorage.setItem('token', newToken);
          
          // Atnaujiname originalaus requesto headerius
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Pakartojame originalų requestą su nauju tokenu
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Jei refresh irgi nepavyksta, išloginti
        console.error('Refresh token failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await axios.post(`${API_URL}/auth/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  // Išsaugoti ABU token'us
  if (response.data.access_token && response.data.refresh_token) {
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    
    const user = {
      username,
      role: response.data.role || 'member',
    };
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  // Trigger storage event for Layout.jsx to detect
  window.dispatchEvent(new Event('storage'));
  
  // Force page reload
  setTimeout(() => {
    window.location.href = '/'; // Nukelia į homepage
  }, 100);
  
  return response.data;
};

// Register naudojant tavo backend /auth/register
export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token'); // ← PRIDĖTA
  localStorage.removeItem('user');
  window.location.reload(); // ← Refresh page
};

// Patikrinti ar vartotojas prisijungęs
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  // Patikrinti ar tokenas nepasibaigęs
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
};

// Gauti dabartinį vartotoją
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Gauti token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Manual refresh token
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');
  
  const response = await axios.post(`${API_URL}/auth/refresh`, {
    refresh_token: refreshToken,
  });
  
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
    return response.data.access_token;
  }
  
  throw new Error('No access token in response');
};

// Check token validity
export const checkTokenValidity = async () => {
  if (!isAuthenticated()) {
    try {
      await refreshToken();
      return true;
    } catch {
      return false;
    }
  }
  return true;
};

export default api;