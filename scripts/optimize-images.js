const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const images = [
  ['site/images/Satellite-1024x1016-1.png', 'redesign/assets/img/satellite.webp', 768, 85],
  ['site/images/Satellogic_Pulau-Bohayen-Malaysia.jpg', 'redesign/assets/img/bohayen.webp', 1600, 86],
  ['site/images/Giza-Egypt_Gallery-scaled.jpg', 'redesign/assets/img/giza.webp', 1600, 86],
  ['site/images/Satellogic_Ko-Kradat-Thailand.jpg', 'redesign/assets/img/ko-kradat.webp', 1600, 86],
  ['redesign/assets/img/platform-dashboard.png', 'redesign/assets/img/platform-dashboard.webp', 1280, 86],
  ...['precision-agriculture', 'forestry', 'urban', 'ground-movement'].map(name => [
    `redesign/assets/img/solutions/${name}.png`, `redesign/assets/img/solutions/${name}.webp`, 1000, 84,
  ]),
];
Promise.all(images.map(async ([source, target, width, quality]) => {
  const result = await sharp(path.join(root, source)).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(path.join(root, target));
  console.log(`${target}: ${Math.round(result.size / 1024)} KiB`);
})).catch(error => { console.error(error); process.exitCode = 1; });
