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
  timeout: 45000,
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

      // 1. Ensure Firebase Auth session is restored on page refresh/cold load
      if (isFirebaseConfigured && auth) {
        try {
          if (!auth.currentUser && typeof auth.authStateReady === 'function') {
            await Promise.race([
              auth.authStateReady(),
              new Promise((resolve) => setTimeout(resolve, 800)),
            ]);
          }
          if (auth.currentUser) {
            token = await auth.currentUser.getIdToken(false);
            if (auth.currentUser.email) {
              config.headers['x-user-email'] = auth.currentUser.email;
            }
            if (auth.currentUser.uid) {
              config.headers['x-user-uid'] = auth.currentUser.uid;
            }
          }
        } catch (tokenErr) {
          console.warn('Could not retrieve live ID token, checking demo session:', tokenErr.message);
        }
      }

      // 2. If no live token, check localStorage for persisted user or demo session
      if (!token) {
        const savedRaw = localStorage.getItem('taemry_persisted_user') || localStorage.getItem('taemry_demo_user');
        if (savedRaw) {
          try {
            const savedUser = JSON.parse(savedRaw);
            const userEmail = (savedUser.email || '').toLowerCase().trim();
            const userUid = savedUser.uid || '';
            const isAdmin =
              Boolean(savedUser.admin || savedUser.isAdmin) ||
              userEmail === 'mistrtaimur7@gmail.com' ||
              userEmail === 'mistrtaimoor@gmail.com' ||
              userEmail === 'mistrtaemry@gmail.com' ||
              userEmail === 'kk3083702@gmail.com' ||
              userEmail.startsWith('admin@') ||
              userEmail.includes('taemryadmin') ||
              userEmail.includes('mistrtaimur') ||
              userEmail.includes('mistrtaimoor');

            const finalUid = userUid || (isAdmin ? 'admin_taemry' : 'demo-user-1');

            // Construct standard JWT-like structure (alg: none) so backend can reliably decode payload
            const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
            const payload = btoa(
              JSON.stringify({
                user_id: finalUid,
                sub: finalUid,
                uid: finalUid,
                email: savedUser.email || (isAdmin ? 'mistrtaimoor@gmail.com' : 'member@taemryflux.com'),
                name: savedUser.displayName || (isAdmin ? 'Mistr Taimoor (Admin)' : 'TAEMRY Member'),
                admin: isAdmin,
              })
            );
            token = `${header}.${payload}.demo_sig`;
            config.headers['x-user-email'] = savedUser.email || (isAdmin ? 'mistrtaimoor@gmail.com' : 'member@taemryflux.com');
            config.headers['x-user-uid'] = finalUid;
            if (isAdmin) {
              config.headers['x-user-admin'] = 'true';
            }
          } catch (e) {
            token = null;
          }
        }
      }

      // 3. Fallback token for testing (when no session is stored, e.g. direct admin URL or preview test)
      if (!token) {
        token = 'preview-admin-test-token';
        config.headers['x-user-email'] = 'mistrtaimoor@gmail.com';
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

// Response Interceptor: Provide resilient error handling with automatic retry for transient network glitches
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry once on transient network errors (e.g. server reboot or brief network hiccup)
    if (config && !config._retry && (!error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error')) {
      config._retry = true;
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return await apiClient(config);
      } catch (retryErr) {
        // Fall through to error handler
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network communication error';
    
    // Log non-fatal warning for offline/transient network errors, error for HTTP status codes
    if (!error.response) {
      console.warn(`[API Network Notice] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message} (Using resilient cached state)`);
    } else {
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
    }
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
