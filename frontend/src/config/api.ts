// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with base configuration
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests (exclude auth endpoints)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // Don't add token to auth endpoints (login, signup, password reset)
  const authEndpoints = ['/api/auth/login', '/api/auth/signup', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];
  const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('🔄 Making request to:', `${config.baseURL}${config.url}`);
  console.log('🔑 Token included:', !isAuthEndpoint && !!token);
  return config;
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error Response:', error.response?.data || error.message);
    console.error('💥 Request failed:', error);
    
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      console.log('🚫 Cleared invalid token');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
