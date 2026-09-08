const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'site');

// Build set of local files that exist
const existing = new Set(fs.readdirSync(dir).filter(f => f.endsWith('.html')));

function slugToFile(pathname) {
  // pathname like /about/ or / or /category/partners/
  let p = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (p === '') return 'index.html';
  return p.replace(/\//g, '_') + '_index.html';
}

let totalReplacements = 0;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
for (const file of files) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');
  let count = 0;
  // Rewrite internal page links in href only. Match https://(www.)?uzmageoai.com/<path>/
  html = html.replace(/href="https?:\/\/(?:www\.)?uzmageoai\.com(\/[a-zA-Z0-9\-_\/]*\/?)"/g, (m, pth) => {
    // skip wp internals / feeds / json / xmlrpc
    if (/^\/(wp-json|wp-admin|wp-content|wp-includes|feed|comments|xmlrpc|wp-login|author|tag)\b/.test(pth) || /xmlrpc|feed|wp-json/.test(pth)) {
      return m;
    }
    const target = slugToFile(pth);
    if (existing.has(target)) {
      count++;
      return 'href="' + target + '"';
    }
    return m; // leave links whose page we didn't download
  });
  if (count > 0) {
    fs.writeFileSync(fp, html);
    totalReplacements += count;
    console.log(`${file}: ${count} links localized`);
  }
}
console.log('TOTAL internal links localized:', totalReplacements);
