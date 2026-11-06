/**
 * Response headers the web app needs wherever it is served (the dev server and `npm run web:serve[:https]`).
 * expo-sqlite runs as WebAssembly in the browser and needs SharedArrayBuffer, which requires cross-origin
 * isolation. "require-corp" (not "credentialless") because Safari does not support the latter.
 */
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

module.exports = { isolationHeaders };
