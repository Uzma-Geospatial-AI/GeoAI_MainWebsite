// Zero-dependency static server for the mirrored Uzma GeoAI site.
// Usage:  node serve.js     ->     http://localhost:8080
//
// The mirror stores every page as a flat file at the site root
// (e.g. about_index.html) with RELATIVE asset links (css/, js/, images/).
// That means assets only resolve when the page's URL base is the root.
// So for "pretty" URLs like /about/ we 302-redirect to the flat file
// instead of serving it in place (which would break relative assets).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject', '.otf': 'font/otf', '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  let filePath = path.join(ROOT, urlPath);

  // Pretty URL like /about/ (no real file): redirect to the flat file so
  // the browser base stays at "/" and relative assets keep resolving.
  const isFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  if (!isFile) {
    const slug = urlPath.replace(/^\/+/, '').replace(/\/+$/, '');
    const flat = slug === '' ? 'index.html' : slug.replace(/\//g, '_') + '_index.html';
    if (fs.existsSync(path.join(ROOT, flat))) {
      res.writeHead(302, { Location: '/' + flat });
      return res.end();
    }
  }

  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('<h1>404 Not Found</h1>'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Uzma GeoAI mirror running at:  http://localhost:${PORT}\n  Press Ctrl+C to stop.\n`);
});
