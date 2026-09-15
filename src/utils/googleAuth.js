/**
 * TAEMRY FLUX - Direct Google Authentication Utility
 * Connects directly with Google Identity Services (GSI) using the client's official Google Client ID.
 * Bypasses all Firebase popups and custom handler URLs for a 100% clean Google sign-in experience.
 */

export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  '270288842304-rlj0mtqut1do2hguljhoe9fs74tl31dn.apps.googleusercontent.com';

/**
 * Ensures Google Identity Services (GSI) script is loaded
 */
export const loadGoogleIdentityScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }
    if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
      return resolve(true);
    }

    // Check if script already exists
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    };
    script.onerror = () => {
      console.warn('[Google Auth] Failed to load Google Identity Services script.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

/**
 * Initiates direct Google OAuth Access Token flow via Google's native dialog
 * @returns {Promise<{accessToken: string}>}
 */
export const requestDirectGoogleToken = async () => {
  const loaded = await loadGoogleIdentityScript();
  if (!loaded || !window.google?.accounts?.oauth2) {
    throw new Error('Google Sign-In service is initializing. Please try again in a moment.');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: (response) => {
          if (response.error) {
            console.error('[Google GSI] Token error:', response);
            if (response.error === 'access_denied') {
              reject(new Error('Sign in cancelled.'));
            } else {
              reject(new Error(response.error_description || response.error || 'Google authentication failed.'));
            }
            return;
          }
          if (response.access_token) {
            resolve({ accessToken: response.access_token });
          } else {
            reject(new Error('No access token received from Google.'));
          }
        },
        error_callback: (err) => {
          console.error('[Google GSI] Error callback:', err);
          reject(new Error(err.message || 'Google Sign-In was closed or blocked.'));
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Fetches user profile directly from Google userinfo API
 * @param {string} accessToken
 * @returns {Promise<{email: string, name: string, picture: string, sub: string}>}
 */
export const fetchGoogleUserInfo = async (accessToken) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    throw new Error('Could not retrieve user profile from Google.');
  }
  return await res.json();
};
