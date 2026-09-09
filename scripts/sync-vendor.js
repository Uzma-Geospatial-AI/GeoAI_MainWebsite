#!/usr/bin/env node
'use strict';

// Use npm ci first to reproduce the exact versions recorded in package-lock.json.
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');

const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'redesign/assets/vendor');
const files = [
  ['three/build/three.module.js', 'three.module.js'],
  ['three/build/three.core.js', 'three.core.js'],
  ['three/LICENSE', 'three-LICENSE.txt'],
  ['gsap/dist/gsap.min.js', 'gsap.min.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'ScrollTrigger.min.js'],
];

// Verify every source before overwriting any committed runtime file.
for (const [source] of files) {
  const file = path.join(root, 'node_modules', source);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile() || fs.statSync(file).size === 0) {
    console.error(`Missing ${source}. Run npm ci before npm run vendor.`);
    process.exit(1);
  }
}

fs.mkdirSync(destination, { recursive: true });
for (const [source, name] of files) {
  const sourceFile = path.join(root, 'node_modules', source);
  if (name === 'three.module.js' || name === 'three.core.js') {
    const result = transformSync(fs.readFileSync(sourceFile, 'utf8'), {
      minify: true, format: 'esm', target: 'es2020', legalComments: 'inline',
    });
    fs.writeFileSync(path.join(destination, name), result.code);
  } else fs.copyFileSync(sourceFile, path.join(destination, name));
  console.log(`Updated assets/vendor/${name}`);
}

// GSAP's package does not ship a LICENSE file. Copying its distributions verbatim
// preserves their copyright notice and license URL in the header.
console.log('Three.js minified; GSAP copied verbatim. Original license notices retained.');
