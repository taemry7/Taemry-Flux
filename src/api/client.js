/**
 * TAEMRY FLUX - Central API Client
 * Configured Axios instance with request interceptor for Firebase Auth ID token injection.
 */

import axios from 'axios';
import { auth, isFirebaseConfigured } from '../firebase/firebase.config.js';

// Base URL: In our integrated single-port container, API requests should use the relative path '/api'.
// We check if VITE_API_BASE_URL is provided, but if it points to localhost (e.g. legacy http://localhost:5000/api
// from local separate process development), we fallback to '/api' so requests always hit the current host.
const resolveApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

  // If empty or relative, ensure it starts with /api
  if (!envUrl || envUrl === '/api') {
    return '/api';
  }

  // Guard against localhost or loopback URLs which fail inside browser iframe previews
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(envUrl)) {
    return '/api';
  }

  return envUrl;
};

const baseURL = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Firebase ID Token as Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = null;

      // 1. Try real Firebase Auth current user
      if (isFirebaseConfigured && auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken(false);
        } catch (tokenErr) {
          console.warn('Could not retrieve live ID token, checking demo session:', tokenErr.message);
        }
      }

      // 2. If no live token, check localStorage for active demo session
      if (!token) {
        const savedDemo = localStorage.getItem('taemry_demo_user');
        if (savedDemo) {
          try {
            const demoUser = JSON.parse(savedDemo);
            token = demoUser.uid || 'demo-user-1';
          } catch (e) {
            token = 'demo-user-1';
          }
        }
      }

      // 3. Fallback token for testing
      if (!token) {
        token = 'preview-test-token';
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error attaching authorization token:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Provide clean error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network communication error';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
    return Promise.reject(error);
  }
);

export default apiClient;
