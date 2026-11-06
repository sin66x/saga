/**
 * Static server for the production web build (dist/), sending the headers the app needs
 * (cross-origin isolation, for the in-browser SQLite database).
 *
 *   npm run web:serve          plain http on http://localhost:8090 (testing on this laptop)
 *   npm run web:serve:https    HTTPS for the iPhone, using the certificate from `npm run cert`
 *                              → https://<laptop-ip>:8443  (+ http://<laptop-ip>:8090 which only
 *                                offers the certificate authority file for the phone to trust)
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { homedir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { isolationHeaders } from './lib/webHeaders';

const dist = join(__dirname, '..', 'dist');
const useHttps = process.argv.includes('--https');
const certDir = process.env.SAGA_CERT_DIR ?? join(homedir(), '.saga-certs');
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.wasm': 'application/wasm',
};

function serveApp(req: IncomingMessage, res: ServerResponse) {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, path);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  for (const [name, value] of Object.entries(isolationHeaders)) res.setHeader(name, value);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // The service worker and app shell must always be revalidated so updates arrive.
  const noCache = /\/(index\.html|sw\.js|manifest\.webmanifest)$/.test(file) ? 'no-cache' : 'public, max-age=3600';
  res.setHeader('Cache-Control', noCache);
  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
}

if (!useHttps) {
  const port = Number(process.env.PORT ?? 8090);
  createServer(serveApp).listen(port, () => console.log(`Saga web build on http://localhost:${port}`));
} else {
  const files = ['server.pem', 'server-key.pem', 'rootCA.pem', 'address.txt'].map((f) => join(certDir, f));
  if (files.some((f) => !existsSync(f))) {
    console.error(`No certificate found in ${certDir}. Run:  npm run cert`);
    process.exit(1);
  }
  const [cert, key, ca, addr] = files.map((f) => readFileSync(f));
  const ip = addr.toString().trim();
  const httpsPort = Number(process.env.HTTPS_PORT ?? 8443);
  const httpPort = Number(process.env.PORT ?? 8090);

  createHttpsServer({ cert, key }, serveApp).listen(httpsPort, '0.0.0.0', () => {
    console.log(`\nSaga is served on  https://${ip}:${httpsPort}`);
  });

  // Plain-http side door: only the certificate authority (public part) and a pointer to the app.
  createServer((req, res) => {
    if ((req.url ?? '').startsWith('/rootCA.pem')) {
      res.setHeader('Content-Type', 'application/x-x509-ca-cert');
      res.setHeader('Content-Disposition', 'attachment; filename="saga-local-ca.pem"');
      res.end(ca);
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      `<meta name=viewport content="width=device-width,initial-scale=1"><body style="font:18px system-ui;padding:24px;line-height:1.5">` +
        `<h2>Saga on this laptop</h2><p><a href="/rootCA.pem">1. Download the certificate</a> (then install and trust it in Settings)</p>` +
        `<p><a href="https://${ip}:${httpsPort}/">2. Open the app</a></p>`,
    );
  }).listen(httpPort, '0.0.0.0', () => {
    console.log(`Certificate download: http://${ip}:${httpPort}/rootCA.pem   (laptop must stay on while you install)\n`);
  });
}
