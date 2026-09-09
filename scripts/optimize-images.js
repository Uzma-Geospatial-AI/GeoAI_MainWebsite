const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const images = [
  ['redesign/assets/library/Satellite-1024x1016-1.png', 'redesign/assets/img/satellite.webp', 768, 85],
  ['redesign/assets/library/Satellogic_Pulau-Bohayen-Malaysia.jpg', 'redesign/assets/img/bohayen.webp', 1600, 86],
  ['redesign/assets/library/Giza-Egypt_Gallery-scaled.jpg', 'redesign/assets/img/giza.webp', 1600, 86],
  ['redesign/assets/library/Satellogic_Ko-Kradat-Thailand.jpg', 'redesign/assets/img/ko-kradat.webp', 1600, 86],
  ['redesign/assets/img/platform-dashboard.png', 'redesign/assets/img/platform-dashboard.webp', 1280, 86],
  ['redesign/assets/library/17-1024x576.png', 'redesign/assets/img/blog/launch.webp', 1000, 84],
  ['redesign/assets/library/WhatsApp-Image-2024-10-29-at-09.51.39.jpeg', 'redesign/assets/img/blog/broga.webp', 800, 84],
  ['redesign/assets/library/uzma-and-satellogic-sign-agreement-1024x768.jpg', 'redesign/assets/img/blog/partnership.webp', 800, 84],
  ['redesign/assets/library/Poster-VC-Map-Your-Route-01-768x768.png', 'redesign/assets/img/community.webp', 600, 84],
  ['redesign/assets/library/about-us-2-1024x683.png', 'redesign/assets/img/editorial/people.webp', 1100, 84],
  ['redesign/assets/library/Award-MTEA2024-_AM309380-1024x683.jpg', 'redesign/assets/img/editorial/award.webp', 1000, 84],
  ['redesign/assets/library/drone-view-beautiful-beach-with-crystal-clear-water-scaled.jpg', 'redesign/assets/img/editorial/coast.webp', 1400, 84],
  ['redesign/assets/library/Cover_Mapping.jpeg', 'redesign/assets/img/editorial/mapping.webp', 1000, 84],
  ['redesign/assets/library/Trainings-11.png', 'redesign/assets/img/editorial/training.webp', 1000, 84],
  ...['precision-agriculture', 'forestry', 'urban', 'ground-movement', 'plantation', 'infrastructure', 'environmental'].map(name => [
    `redesign/assets/img/solutions/${name}.png`, `redesign/assets/img/solutions/${name}.webp`, 1000, 84,
  ]),
];
Promise.all(images.map(async ([source, target, width, quality]) => {
  const result = await sharp(path.join(root, source)).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(path.join(root, target));
  console.log(`${target}: ${Math.round(result.size / 1024)} KiB`);
})).catch(error => { console.error(error); process.exitCode = 1; });
