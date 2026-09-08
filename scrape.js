const scrape = require('website-scraper').default;
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://www.uzmageoai.com';

const pages = [
  '/', '/about/', '/uzmasat-1/', '/solutions/', '/contact-us/',
  '/satellite-imagery/', '/mapping-analytics/', '/gallery/',
  '/infrastructuremonitoring/', '/plantationmanagement/', '/enviromentalmonitoring/',
  '/sustainableforestrymanagement/', '/services/', '/ground-movement/',
  '/urban-planning-development/', '/precision-agriculture/', '/ai-platform-development/',
  '/training-consultation/', '/blog/', '/career/',
  // posts
  '/uzma-and-satellogic-sign-multi-million-dollar-3-year-agreement/',
  '/uzma-berhad-unveils-uzmasat-1-a-new-era-in-geospatial-technology/',
  '/a-case-study-of-broga-hills-the-role-of-earth-observation-satellites-in-environmental-monitoring/',
  '/uzma-berhad-pioneers-the-uzmasat-1-programme-for-advanced-geospatial-intelligence-2/',
  '/satelit-uzmasat-1-jadi-pemantau-bumi/',
  '/uzmasat-1-beri-nilai-tambah-pembangunan-satelit-negara/',
  '/uzma-partners-with-key-organisations-to-advance-malaysias-geospatial-industry/',
  '/uzma-gears-up-for-the-launch-of-uzmasat-1-satellite/',
  '/satelit-uzmasat-1-boleh-lihat-jelas-kereta-dari-ketinggian-500km-di-angkasa/',
  '/satelit-penderiaan-jauh-malaysia-uzmasat-1-dilancar/',
  '/malaysia-launches-remote-sensing-satellite-uzmasat-1/',
  '/uzma-berhad-cetus-era-baharu-teknologi-angkasa-negara-melalui-pelancaran-satelit-uzmasat-1/',
  '/pelancaran-uzma-sat-1-bukti-kejayaan-dasar-angkasa-negara-2030-mosti/',
  '/uzma-launches-malaysias-first-commercial-earth-observation-satellite-uzmasat-1/',
  '/uzmasat-1-berjaya-dilancarkan/',
  '/satelit-penderiaan-jauh-keluaran-syarikat-tempatan-uzmasat-1-berjaya-dilancar-pada-rabu-video/',
  '/uzma-berhad-launches-malaysias-first-high-resolution-earth-observation-satellite-uzmasat-1/',
  '/uzma-berhad-marks-a-historic-milestone-with-the-launch-of-uzmasat-1/',
  // categories
  '/category/partners/', '/category/partners/satellogic/', '/category/programme/',
  '/category/press-release/', '/category/programme/award/', '/category/solutions/',
  '/category/solutions/enviromental-monitoring/', '/category/uzmasat-1/',
];

const urls = pages.map(p => ({ url: ORIGIN + p, filename: (p === '/' ? 'index.html' : p.replace(/^\//,'').replace(/\/$/,'') + '/index.html') }));

const options = {
  urls,
  directory: path.join(__dirname, 'site'),
  recursive: true,
  maxRecursiveDepth: 1,
  maxDepth: 3,
  prettifyUrls: false,
  requestConcurrency: 4,
  ignoreErrors: true,
  request: { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' } },
  urlFilter: (url) => {
    // Keep same-origin assets/pages; also allow common CDN font/css that Elementor pulls (keep local domain only for HTML crawl)
    try {
      const u = new URL(url, ORIGIN);
      if (u.origin === ORIGIN) return true;
      // Allow google fonts + gstatic assets so pages render offline
      if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return true;
      return false;
    } catch(e) { return false; }
  },
  sources: [
    { selector: 'img', attr: 'src' },
    { selector: 'img', attr: 'srcset' },
    { selector: 'img', attr: 'data-src' },
    { selector: 'img', attr: 'data-srcset' },
    { selector: 'source', attr: 'src' },
    { selector: 'source', attr: 'srcset' },
    { selector: 'video', attr: 'src' },
    { selector: 'video', attr: 'poster' },
    { selector: 'link[rel="stylesheet"]', attr: 'href' },
    { selector: 'link[rel="icon"]', attr: 'href' },
    { selector: 'link[rel="apple-touch-icon"]', attr: 'href' },
    { selector: 'link[rel="preload"]', attr: 'href' },
    { selector: 'script', attr: 'src' },
    { selector: 'style' },
    { selector: '[style]', attr: 'style' },
    { selector: 'a', attr: 'href' },
    { selector: '*', attr: 'data-background' },
    { selector: '*', attr: 'data-bg' },
  ],
};

console.log('Starting scrape of', urls.length, 'pages...');
scrape(options).then((result) => {
  console.log('DONE. Root resources:', result.length);
}).catch((err) => {
  console.error('FATAL', err.message);
  process.exit(1);
});
