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

  // Reset internal splash wave animation so it replays smoothly
  const splashEl = overlay.querySelector('.fade-overlay-splash');
  if (splashEl) {
    splashEl.classList.remove('animate-active');
    // Force reflow
    void (splashEl as HTMLElement).offsetWidth;
    splashEl.classList.add('animate-active');
  }

  // 2. 0.2 second (200ms) baad naye page / option par jana
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
      }, 50);
    });
  }, delayMs);
}

/**
 * Initializes global event listeners for .fade-trigger elements and initial page load
 */
export function initGlobalPageTransitions(): () => void {
  if (typeof window === 'undefined') return () => {};

  const overlay = document.getElementById('fadeOverlay');
  if (overlay) {
    // Initial load fade-in
    overlay.classList.add('loaded');
  }

  // Delegate click for any element with .fade-trigger class
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

  document.addEventListener('click', handleClick);

  return () => {
    document.removeEventListener('click', handleClick);
  };
}
