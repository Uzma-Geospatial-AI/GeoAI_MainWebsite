const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'site');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let checked = 0, missing = 0;
const missingList = {};
for (const file of files) {
  const html = fs.readFileSync(path.join(dir, file), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  for (let ref of refs) {
    if (/^(https?:|data:|mailto:|tel:|javascript:|#)/.test(ref)) continue;
    if (ref.trim() === '') continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (clean === '') continue;
    const target = path.join(dir, clean);
    checked++;
    if (!fs.existsSync(target)) {
      missing++;
      (missingList[clean] = missingList[clean] || []).push(file);
    }
  }
}
console.log('Local refs checked:', checked);
console.log('Missing:', missing);
const entries = Object.entries(missingList).sort((a,b)=>b[1].length-a[1].length);
for (const [ref, inFiles] of entries.slice(0, 40)) {
  console.log(`  MISSING (${inFiles.length}x): ${ref}`);
}
