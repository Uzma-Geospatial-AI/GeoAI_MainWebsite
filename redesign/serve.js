// Zero-dependency static server for the redesigned site.
// Usage:  node serve.js   ->   http://localhost:8080
const http = require('http');
const fs = require('fs');
const path = require('path');
const { gzip } = require('zlib');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (u === '/') u = '/index.html';
  let file = path.join(ROOT, u);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('<h1>404</h1>'); }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', Vary: 'Accept-Encoding' };
    if (/\b gzip\b|^gzip\b/.test(req.headers['accept-encoding'] || '') && ['.html', '.css', '.js', '.json', '.svg'].includes(ext)) {
      gzip(data, (error, compressed) => {
        if (error) { res.writeHead(200, headers); return res.end(data); }
        res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip' });
        res.end(compressed);
      });
    } else { res.writeHead(200, headers); res.end(data); }
  });
}).listen(PORT, () => console.log(`\n  Uzma GeoAI (redesign) running at:  http://localhost:${PORT}\n  Press Ctrl+C to stop.\n`));
