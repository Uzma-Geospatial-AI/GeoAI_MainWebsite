#!/usr/bin/env node
'use strict';

// No npm dependencies: CI can validate the committed, deployable folder directly.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../redesign');
const entry = path.join(root, 'index.html');
const errors = new Set();
const visited = new Set();
const htmlIds = new Map();
let checked = 0;

const label = file => path.relative(root, file).split(path.sep).join('/');
const report = (file, message) => errors.add(`${label(file)}: ${message}`);
const external = value => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
const decodeHtml = value => value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");

function decode(value, file) {
  try { return decodeURIComponent(value); }
  catch { report(file, `invalid URL encoding in ${JSON.stringify(value)}`); return null; }
}

function insideRoot(file) {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function exists(file, source) {
  if (!insideRoot(file)) {
    report(source, `reference escapes the deployable folder: ${label(file)}`);
    return false;
  }
  try {
    const stat = fs.statSync(file);
    if (stat.isFile() && stat.size > 0) return true;
    report(source, `asset is empty or is not a file: ${label(file)}`);
  } catch {
    report(source, `missing local asset: ${label(file)}`);
  }
  return false;
}

function idsFor(file) {
  if (htmlIds.has(file)) return htmlIds.get(file);
  const ids = new Set();
  const html = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  for (const match of html.matchAll(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    const id = decodeHtml(match[1] ?? match[2] ?? match[3]);
    if (ids.has(id)) report(file, `duplicate id ${JSON.stringify(id)}`);
    ids.add(id);
  }
  htmlIds.set(file, ids);
  return ids;
}

function reference(raw, source, { base = path.dirname(source), anchors = false } = {}) {
  const ref = decodeHtml(raw).trim();
  if (!ref || external(ref)) return;
  const hashAt = ref.indexOf('#');
  const fragment = hashAt < 0 ? null : decode(ref.slice(hashAt + 1), source);
  const pathname = decode((hashAt < 0 ? ref : ref.slice(0, hashAt)).split('?')[0], source);
  if (pathname === null) return;
  const target = pathname ? path.resolve(pathname.startsWith('/') ? root : base, pathname.replace(/^\/+/, '')) : source;
  checked++;
  if (!exists(target, source)) return;
  if (anchors && fragment !== null && /\.html?$/i.test(target)) {
    if (!fragment) report(source, 'empty # link; use a real destination or a button');
    else if (!idsFor(target).has(fragment)) report(source, `missing anchor #${fragment} in ${label(target)}`);
  }
  if (/\.(?:html?|css|m?js)$/i.test(target)) inspect(target);
}

function cssReferences(css, file) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of clean.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) {
    const value = match[1] ?? match[2] ?? match[3];
    if (!value.trim().startsWith('#')) reference(value, file);
  }
  for (const match of clean.matchAll(/@import\s+["']([^"']+)["']/gi)) reference(match[1], file);
}

function jsReferences(js, file) {
  // Imports resolve against the module file, including bundled Three.js imports.
  for (const match of js.matchAll(/\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']/g)) {
    const specifier = match[1] ?? match[2];
    if (external(specifier)) continue;
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      report(file, `bare module import needs a browser import map: ${specifier}`);
      continue;
    }
    reference(specifier, file);
  }
  // Explicit URL() constructors also resolve against their module file.
  for (const match of js.matchAll(/new\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g)) reference(match[1], file);
  // Image-selector maps and other document-relative local asset literals.
  // Deliberately do not evaluate JavaScript or guess computed/template paths.
  if (!label(file).startsWith('assets/vendor/')) {
    for (const match of js.matchAll(/["'`](\.?\/?assets\/[^"'`\r\n$]+)["'`]/g)) reference(match[1], file, { base: root });
  }
}

function inspect(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const content = fs.readFileSync(file, 'utf8');
  const extension = path.extname(file).toLowerCase();
  if (extension === '.html' || extension === '.htm') {
    const html = content.replace(/<!--[\s\S]*?-->/g, '');
    idsFor(file);
    for (const match of html.matchAll(/\b(src|href|poster|data-src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      reference(match[2] ?? match[3] ?? match[4], file, { anchors: match[1].toLowerCase() === 'href' });
    }
    for (const match of html.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) cssReferences(decodeHtml(match[1] ?? match[2]), file);
    for (const match of html.matchAll(/\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const value = match[1] ?? match[2];
      if (!value.trim().startsWith('data:')) {
        for (const candidate of value.split(',')) reference(candidate.trim().split(/\s+/)[0], file);
      }
    }
    for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) cssReferences(match[1], file);
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) jsReferences(match[1], file);
  } else if (extension === '.css') cssReferences(content, file);
  else if (extension === '.js' || extension === '.mjs') jsReferences(content, file);
}

const required = [
  'index.html', 'assets/css/style.css', 'assets/js/main.js', 'assets/js/space-scene.js',
  'assets/vendor/three.module.js', 'assets/vendor/three.core.js', 'assets/vendor/three-LICENSE.txt',
  'assets/vendor/gsap.min.js', 'assets/vendor/ScrollTrigger.min.js',
];
for (const relative of required) {
  const file = path.join(root, relative);
  if (exists(file, entry) && /\.(?:html?|css|m?js)$/i.test(file)) inspect(file);
}

if (fs.existsSync(entry) && fs.statSync(entry).isFile()) {
  const html = fs.readFileSync(entry, 'utf8');
  if (!/<title>\s*[^<\s][^<]*<\/title>/i.test(html)) report(entry, 'missing or empty <title>');
  if (!/<html\b[^>]*\blang\s*=/i.test(html)) report(entry, 'missing document language');
  if (!/<meta\b[^>]*name\s*=\s*["']viewport["']/i.test(html)) report(entry, 'missing viewport meta tag');
}

console.log(`Checked ${checked} local references across ${visited.size} HTML, CSS and JavaScript files.`);
if (errors.size) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exitCode = 1;
} else {
  console.log('PASS: local assets, module imports, anchors and required runtime files resolve.');
}
