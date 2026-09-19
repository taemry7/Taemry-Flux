/**
 * TAEMRY FLUX - Global Blur Splash Page & Option Transition Engine
 * 
 * Provides smooth 200ms blur splash animate fade-in / fade-out transitions across:
 * - All page navigation (Login -> Home, Home -> Dashboard, Dashboard -> Login, etc.)
 * - All page back & forward browser navigation (Back, Forward, hashchange, popstate)
 * - All option & tab selection clicks (Overview, Buy Package, Watch Ads, Deposit, Withdraw, etc.)
 * - Dedicated .fade-trigger links and buttons
 */

let isInternalNavigation = false;

export function setInternalNavigationFlag(val: boolean): void {
  isInternalNavigation = val;
}

export function getInternalNavigationFlag(): boolean {
  return isInternalNavigation;
}

/**
 * Triggers full-screen blur splash animate overlay (pure blur splash, strictly no solid black).
 * @param callback Action to execute after 200ms blur splash (e.g. switch page, change tab)
 * @param delayMs Duration in milliseconds (defaults to 200ms matching CSS transition)
 */
export function triggerPageTransition(callback?: () => void, delayMs: number = 200): void {
  if (typeof document === 'undefined') {
    if (callback) callback();
    return;
  }

  const overlay = document.getElementById('fadeOverlay');
  if (!overlay) {
    if (callback) callback();
    return;
  }

  // 1. Overlay show karna (Fade Out with pure blur splash animation)
  overlay.classList.remove('loaded');
  overlay.classList.add('show');

  // Reset internal splash wave animation smoothly without forced layout reflow
  const splashEl = overlay.querySelector('.fade-overlay-splash');
  if (splashEl) {
    splashEl.classList.remove('animate-active');
    requestAnimationFrame(() => {
      splashEl.classList.add('animate-active');
    });
  }

  // 2. Snappy 60+ FPS navigation transition
  setTimeout(() => {
    if (callback) {
      try {
        callback();
      } catch (err) {
        console.error('[PageTransition] Error in navigation callback:', err);
      }
    }

    // 3. Page / Option load hote hi Fade In effect (overlay gayab ho jana)
    requestAnimationFrame(() => {
      setTimeout(() => {
        overlay.classList.remove('show');
        overlay.classList.add('loaded');
      }, 30);
    });
  }, Math.min(delayMs, 100));
}

/**
 * Initializes global event listeners for .fade-trigger elements, button fluid splash ripples, and initial page load
 */
export function initGlobalPageTransitions(): () => void {
  if (typeof window === 'undefined') return () => {};

  const overlay = document.getElementById('fadeOverlay');
  if (overlay) {
    // Initial load fade-in
    overlay.classList.add('loaded');
  }

  // 1. Global Fluid Splash Ripple Animation on ALL buttons across the entire app
  const handleButtonSplash = (e: MouseEvent) => {
    const target = (e.target as HTMLElement)?.closest('button, [role="button"], .btn-splash, .btn-fluid-splash');
    if (!target) return;
    if (target.hasAttribute('disabled') || target.getAttribute('aria-disabled') === 'true') return;

    const el = target as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const isPointer = e.clientX > 0 || e.clientY > 0;
    const x = isPointer ? e.clientX - rect.left : rect.width / 2;
    const y = isPointer ? e.clientY - rect.top : rect.height / 2;
    const size = Math.max(rect.width, rect.height) * 2.2;

    // Fast non-blocking position setup without synchronous layout reflow
    if (!el.style.position || el.style.position === 'static') {
      el.style.position = 'relative';
    }
    el.style.overflow = 'hidden';

    // Remove old waves if user clicks repeatedly
    const prevWaves = el.querySelectorAll('.fluid-splash-wave, .fluid-splash-ring');
    if (prevWaves.length > 2) {
      prevWaves[0].remove();
    }

    const splash = document.createElement('span');
    splash.className = 'fluid-splash-wave';
    splash.style.width = `${size}px`;
    splash.style.height = `${size}px`;
    splash.style.left = `${x}px`;
    splash.style.top = `${y}px`;

    const ring = document.createElement('span');
    ring.className = 'fluid-splash-ring';
    ring.style.width = `${size * 0.85}px`;
    ring.style.height = `${size * 0.85}px`;
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;

    el.appendChild(splash);
    el.appendChild(ring);

    setTimeout(() => {
      splash.remove();
      ring.remove();
    }, 500);
  };

  // 2. Delegate click for any element with .fade-trigger class
  const handleClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement)?.closest('.fade-trigger');
    if (!target) return;

    const href = target.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      e.preventDefault();
      triggerPageTransition(() => {
        if (href.startsWith('#')) {
          window.location.hash = href;
        } else {
          window.location.href = href;
        }
      });
    }
  };

  document.addEventListener('click', handleButtonSplash, true);
  document.addEventListener('click', handleClick);

  return () => {
    document.removeEventListener('click', handleButtonSplash, true);
    document.removeEventListener('click', handleClick);
  };
}
