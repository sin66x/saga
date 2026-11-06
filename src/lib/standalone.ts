/** True when running as an installed web app (opened from the Home Screen). */
export function isInstalledPwa(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}
