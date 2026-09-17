import React, { useEffect } from 'react';

/**
 * TAEMRY FLUX - Multi-Zone Ad Network & Direct Link Integration
 * - Direct Links:
 *   1. https://omg10.com/4/11824188
 *   2. https://omg10.com/4/11824210
 * - Ad Scripts:
 *   1. Zone 11824194 (https://al5sm.com/tag.min.js)
 *   2. Zone 282061   (https://quge5.com/88/tag.min.js)
 *   3. Zone 11824200 (https://5gvci.com/act/files/tag.min.js?z=11824200)
 *   4. Zone 11824202 (https://nap5k.com/tag.min.js)
 *   5. Zone 11824208 (https://n6wxm.com/vignette.min.js - Vignette Ad)
 * 
 * STRICT INVARIANT:
 * - Completely disabled and purged on Login & Signup pages (currentPage === 'login').
 * - Enabled on all member and content pages (home, dashboard, cloud-miner, etc.).
 */

export const DIRECT_AD_LINKS = [
  'https://omg10.com/4/11824188',
  'https://omg10.com/4/11824210',
  'https://omg10.com/4/11824233',
  'https://omg10.com/4/11824229',
];

export const AD_ZONES = [
  { id: 'zone_11824194', zone: '11824194', script: 'https://al5sm.com/tag.min.js', type: 'tag' },
  { id: 'zone_282061', zone: '282061', script: 'https://quge5.com/88/tag.min.js', type: 'async_tag' },
  { id: 'zone_11824200', zone: '11824200', script: 'https://5gvci.com/act/files/tag.min.js?z=11824200', type: 'async_param' },
  { id: 'zone_11824202', zone: '11824202', script: 'https://nap5k.com/tag.min.js', type: 'tag' },
  { id: 'zone_11824208', zone: '11824208', script: 'https://n6wxm.com/vignette.min.js', type: 'vignette' },
];

/**
 * Utility function to open a direct ad link in a new tab safely
 * Alternates between direct link 1 and direct link 2 based on ad index
 */
export function openDirectAdLink(adIndex = 0) {
  try {
    const directUrl = DIRECT_AD_LINKS[Math.abs(adIndex) % DIRECT_AD_LINKS.length];
    const win = window.open(directUrl, '_blank', 'noopener,noreferrer');
    return { success: true, url: directUrl, windowRef: win };
  } catch (err) {
    console.warn('[Ad Direct Link Open Error]:', err);
    return { success: false, url: DIRECT_AD_LINKS[0], error: err };
  }
}

export default function AdNetworkLoader({ currentPage, activeTab }) {
  const isAuthPage =
    currentPage === 'login' ||
    activeTab === 'signup' ||
    activeTab === 'signin' ||
    (typeof window !== 'undefined' &&
      (window.location.pathname.includes('login') ||
        window.location.pathname.includes('signup') ||
        window.location.hash.includes('login') ||
        window.location.hash.includes('signup')));

  useEffect(() => {
    // 1. If user is on Login or Signup page, PURGE all ad scripts and elements immediately
    if (isAuthPage) {
      try {
        const adElements = document.querySelectorAll('[data-taemry-ad="true"]');
        adElements.forEach((el) => {
          try {
            el.remove();
          } catch {}
        });
      } catch {}
      return;
    }

    // 2. If on member/content pages, safely inject all 5 ad scripts if not already present
    const injectedScripts = [];

    // Helper to inject a script safely
    const injectScript = (id, setupFn) => {
      if (document.getElementById(id)) return;
      try {
        const s = document.createElement('script');
        s.id = id;
        s.setAttribute('data-taemry-ad', 'true');
        setupFn(s);
        (document.body || document.documentElement).appendChild(s);
        injectedScripts.push(s);
      } catch (err) {
        console.warn(`[Ad Script ${id} Injection Notice]:`, err);
      }
    };

    // Script 1: Zone 11824194
    injectScript('taemry-ad-11824194', (s) => {
      s.dataset.zone = '11824194';
      s.src = 'https://al5sm.com/tag.min.js';
    });

    // Script 2: Zone 282061 (async data-cfasync="false")
    injectScript('taemry-ad-282061', (s) => {
      s.src = 'https://quge5.com/88/tag.min.js';
      s.setAttribute('data-zone', '282061');
      s.async = true;
      s.setAttribute('data-cfasync', 'false');
    });

    // Script 3: Zone 11824200 (async data-cfasync="false")
    injectScript('taemry-ad-11824200', (s) => {
      s.src = 'https://5gvci.com/act/files/tag.min.js?z=11824200';
      s.async = true;
      s.setAttribute('data-cfasync', 'false');
    });

    // Script 4: Zone 11824202
    injectScript('taemry-ad-11824202', (s) => {
      s.dataset.zone = '11824202';
      s.src = 'https://nap5k.com/tag.min.js';
    });

    // Script 5: Zone 11824208 (Vignette)
    injectScript('taemry-ad-11824208', (s) => {
      s.dataset.zone = '11824208';
      s.src = 'https://n6wxm.com/vignette.min.js';
    });

    // Expose direct link helpers globally
    if (typeof window !== 'undefined') {
      window.__taemryDirectAdLinks = DIRECT_AD_LINKS;
      window.__taemryOpenDirectAd = openDirectAdLink;
    }

    // Cleanup when leaving non-login page to login page
    return () => {
      // If next route is auth page, elements will be removed by next render cycle
    };
  }, [isAuthPage, currentPage]);

  // If on login/signup, render absolutely nothing
  if (isAuthPage) {
    return null;
  }

  // On other pages, provide hidden container anchors for ad network zone targeting
  return (
    <div id="taemry-ad-network-containers" className="pointer-events-none opacity-0 select-none h-0 w-0 overflow-hidden" aria-hidden="true" data-taemry-ad="true">
      <div id="container-282061" data-zone="282061" data-taemry-ad="true"></div>
      <div id="container-11824200" data-zone="11824200" data-taemry-ad="true"></div>
      <div id="container-11824194" data-zone="11824194" data-taemry-ad="true"></div>
      <div id="container-11824202" data-zone="11824202" data-taemry-ad="true"></div>
      <div id="container-11824208" data-zone="11824208" data-taemry-ad="true"></div>
    </div>
  );
}
