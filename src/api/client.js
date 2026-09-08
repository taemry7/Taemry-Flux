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

// Request Interceptor: Attach Firebase ID Token as Bearer token & sanitize duplicate /api prefix
apiClient.interceptors.request.use(
  async (config) => {
    // Strip redundant leading '/api' prefix to prevent '/api/api/...' when combined with baseURL: '/api'
    if (config.url && typeof config.url === 'string') {
      if (config.url.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api/, '');
      } else if (config.url === '/api') {
        config.url = '/';
      }
    }

    try {
      let token = null;

      // 1. Try real Firebase Auth current user
      if (isFirebaseConfigured && auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken(false);
          if (auth.currentUser.email) {
            config.headers['x-user-email'] = auth.currentUser.email;
          }
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
            const userEmail = (demoUser.email || '').toLowerCase().trim();
            const isAdmin =
              Boolean(demoUser.admin || demoUser.isAdmin) ||
              userEmail === 'mistrtaemry@gmail.com' ||
              userEmail.startsWith('admin@') ||
              userEmail.includes('taemryadmin');

            // Construct standard JWT-like structure (alg: none) so backend can reliably decode payload
            const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
            const payload = btoa(
              JSON.stringify({
                user_id: demoUser.uid || (isAdmin ? 'admin_taemry' : 'demo-user-1'),
                sub: demoUser.uid || (isAdmin ? 'admin_taemry' : 'demo-user-1'),
                email: demoUser.email || (isAdmin ? 'mistrtaemry@gmail.com' : 'member@taemryflux.com'),
                name: demoUser.displayName || (isAdmin ? 'Mistr Taemry (Admin)' : 'TAEMRY Member'),
                admin: isAdmin,
              })
            );
            token = `${header}.${payload}.demo_sig`;
            config.headers['x-user-email'] = demoUser.email || (isAdmin ? 'mistrtaemry@gmail.com' : 'member@taemryflux.com');
            if (isAdmin) {
              config.headers['x-user-admin'] = 'true';
            }
          } catch (e) {
            token = 'preview-admin-test-token';
          }
        }
      }

      // 3. Fallback token for testing (when no session is stored, e.g. direct admin URL or preview test)
      if (!token) {
        token = 'preview-admin-test-token';
        config.headers['x-user-email'] = 'mistrtaemry@gmail.com';
        config.headers['x-user-admin'] = 'true';
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

const sanitizeEndpoint = (url) => {
  if (typeof url === 'string') {
    if (url.startsWith('/api/')) {
      return url.replace(/^\/api/, '');
    } else if (url === '/api') {
      return '/';
    }
  }
  return url;
};

export const apiGet = async (url, config = {}) => {
  const res = await apiClient.get(sanitizeEndpoint(url), config);
  return res.data;
};

export const apiPost = async (url, data = {}, config = {}) => {
  const res = await apiClient.post(sanitizeEndpoint(url), data, config);
  return res.data;
};

export const apiPut = async (url, data = {}, config = {}) => {
  const res = await apiClient.put(sanitizeEndpoint(url), data, config);
  return res.data;
};

export const apiDelete = async (url, config = {}) => {
  const res = await apiClient.delete(sanitizeEndpoint(url), config);
  return res.data;
};

export default apiClient;
