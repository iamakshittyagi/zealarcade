import axios from 'axios';

// Pre-configured axios client that hits your backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — automatically attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('zealToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('zealToken');
      localStorage.removeItem('zealUser');
    }
    return Promise.reject(error);
  }
);

export default api;