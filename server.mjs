import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

// Serve only the prototype assets, never repository files or credentials.
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/barcode.min.js', ['barcode.min.js', 'text/javascript; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
]);
const assets = new Map();
for (const [route, [file, type]] of routes) {
  assets.set(route, { body: await readFile(new URL(file, import.meta.url)), type });
}

const server = createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, type, body) => {
    res.writeHead(status, { 'Content-Type': type });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return send(405, 'text/plain; charset=utf-8', 'Method not allowed');
  }
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; }
  catch { return send(400, 'text/plain; charset=utf-8', 'Bad request'); }
  if (pathname === '/health') {
    return send(200, 'application/json; charset=utf-8', '{"status":"ok"}');
  }
  const asset = assets.get(pathname);
  if (!asset) return send(404, 'text/plain; charset=utf-8', 'Not found');
  send(200, asset.type, asset.body);
});
server.listen(port, '0.0.0.0', () => console.log(`Rizo prototype listening on port ${port}`));
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
});
