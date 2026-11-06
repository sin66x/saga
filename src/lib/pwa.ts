import { installSpeechUnlock } from './speechWeb';

export { isInstalledPwa } from './standalone';

/** Registers the offline service worker and asks the browser not to evict our data. */
export function registerPwa(): void {
  installSpeechUnlock();
  // Ask the browser to keep the database (best effort; iOS may ignore it).
  void navigator.storage?.persist?.().catch(() => {});
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const register = () => navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('[pwa] service worker failed', e));
    // The page may already be fully loaded by the time the app starts.
    if (document.readyState === 'complete') void register();
    else window.addEventListener('load', () => void register());
  }
}
