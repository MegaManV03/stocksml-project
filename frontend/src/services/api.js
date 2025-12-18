import axios from 'axios';

// Use environment variable for API URL or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'https://stocksml.onrender.com';

const API = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Automatiškai prideda JWT token
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;