// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { isolationHeaders } = require('./scripts/lib/webHeaders');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web uses a WebAssembly build of SQLite.
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer (needed by expo-sqlite on web) requires cross-origin isolation.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  for (const [name, value] of Object.entries(isolationHeaders)) res.setHeader(name, value);
  return middleware(req, res, next);
};

module.exports = config;
