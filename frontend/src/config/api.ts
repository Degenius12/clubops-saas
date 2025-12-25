// API Configuration
const PRODUCTION_API_URL = 'https://clubops-backend.vercel.app';
const DEV_API_URL = 'http://localhost:3001'; // Backend runs on port 3001 (set in backend/.env)

// CRITICAL FIX: Always respect VITE_API_URL if explicitly set (for local development)
// This allows developers to override the URL regardless of hostname
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PRODUCTION_API_URL : DEV_API_URL);

// Log which URL is being used (helpful for debugging)
console.log('API Base URL:', API_BASE_URL);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Environment Mode:', import.meta.env.MODE);

// Create axios instance with base configuration
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Changed to false for cross-origin requests
  timeout: 15000, // 15 second timeout
});

// Log initialization
console.log('ApiClient initialized');
console.log('- API Base URL:', API_BASE_URL);
console.log('- Environment Mode:', import.meta.env.MODE);
console.log('- Token found:', !!localStorage.getItem('token'));

// Add auth token to requests (exclude auth endpoints)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  // Don't add token to auth endpoints (login, signup, password reset)
  const authEndpoints = ['/api/auth/login', '/api/auth/signup', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];
  const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));

  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // CRITICAL FIX: Add cache-busting headers to bypass Vercel's stale CORS cache
  // This ensures the browser gets fresh OPTIONS responses from the backend
  config.headers['Cache-Control'] = 'no-cache';
  config.headers['Pragma'] = 'no-cache';

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
