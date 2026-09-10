const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { createHash } = require('node:crypto');
const fingerprint = bytes => createHash('sha256').update(bytes).digest('hex');
const sharp = require('sharp');
async function expectStill(before, after) {
  const a = await sharp(before).raw().toBuffer();
  const b = await sharp(after).raw().toBuffer();
  expect(a.length).toBe(b.length);
  // Frosted backgrounds can vary by one RGB level during GPU compositing.
  // Detect actual visual movement without treating that rounding as animation.
  let changed = 0;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 3) changed++;
  expect(changed / a.length).toBeLessThan(0.0001);
}

test('satellite renders, responds to scroll and pauses', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#space-visual')).toHaveClass(/scene-ready/);
  await expect(page.locator('canvas.space-canvas')).toBeVisible();
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume animation', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.hero-copy > *').evaluateAll(items => items.every(item => getComputedStyle(item).opacity === '1'))).toBe(true);
  await page.waitForTimeout(150);
  const pausedFrame = await page.screenshot({ clip: { x: 780, y: 150, width: 600, height: 600 } });
  await page.waitForTimeout(200);
  await expectStill(pausedFrame, await page.screenshot({ clip: { x: 780, y: 150, width: 600, height: 600 } }));
  await page.getByRole('button', { name: 'Resume animation', exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await expect(page.locator('#scene-caption')).toHaveText('Precision, from every angle.');
  await page.waitForTimeout(500);
  expect(fingerprint(await page.screenshot({ clip: { x: 780, y: 150, width: 600, height: 600 } }))).not.toEqual(fingerprint(pausedFrame));
  expect(errors).toEqual([]);
});

test('imagery tabs, keyboard navigation and magnification work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#imagery');
  await page.getByRole('tab', { name: 'Giza EG' }).click();
  await expect(page.locator('#image-location')).toHaveText('Giza, Egypt');
  await expect(page.locator('#earth-image')).toHaveAttribute('src', 'assets/img/giza.webp');
  await expect(page.locator('#imagery-panel')).toHaveAttribute('aria-labelledby', 'tab-giza');
  await page.getByRole('tab', { name: 'Giza EG' }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Ko Kradat TH' })).toBeFocused();
  await expect(page.locator('#image-location')).toHaveText('Ko Kradat, Thailand');
  await page.locator('#image-zoom').fill('2');
  await expect(page.locator('#zoom-output')).toHaveText('2.0×');
  await expect(page.locator('#earth-image')).toHaveCSS('transform', 'matrix(2, 0, 0, 2, 0, 0)');
  await page.getByRole('tab', { name: 'Pulau Bohayen MY' }).click();
  await expect(page.locator('#image-zoom')).toHaveValue('1');
});

test('solution selector updates the selected product and portal destination', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#solutions');
  await page.getByRole('button', { name: 'URBAN GAI', exact: true }).click();
  await expect(page.locator('#solution-title')).toHaveText('URBAN');
  await expect(page.locator('#solution-link')).toHaveAttribute('href', 'https://uzmadigitalearth.app/projects');
  await page.getByRole('button', { name: 'UzmaSATRIA', exact: true }).click();
  await expect(page.locator('#solution-title')).toHaveText('UzmaSATRIA');
  await expect(page.locator('#solution-description')).toContainText('Sign in');
  await expect(page.locator('#solution-link')).toHaveAttribute('href', 'https://uzmadigitalearth.app/uzmasatria');
});

test('restored offerings and supplied brand palette stay complete', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#solutions');
  const buttons = page.locator('[data-solution]');
  await expect(buttons).toHaveCount(6);
  await expect(page.locator(".solution-name")).toHaveText(["AGRO", "ESTATE", "ASSET", "ENVIRO", "URBAN", "UzmaSATRIA"]);
  for (const button of await buttons.all()) {
    const title = await button.locator('.solution-name').textContent();
    await button.click();
    await expect(page.locator('#solution-title')).toHaveText(title);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(await page.locator('#solution-image').evaluate(async image => { await image.decode(); return image.naturalWidth > 0; })).toBe(true);
  }
  await expect(page.locator('.service-item')).toHaveCount(4);
  await expect(page.locator('.partner-logos img')).toHaveCount(14);
  await expect(page.locator('.client-logos img')).toHaveCount(7);
  await expect(page.locator('.vision-mission')).toContainText('2030');
  await expect(page.locator('.film-link')).toHaveAttribute('href', 'https://youtu.be/T0oPHhV7D4Q');
  await expect(page.locator('.contact-appointment')).toHaveAttribute('data-booking', '');
  await expect(page.locator('#services')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.nav .brand img')).toHaveCount(2);
  await expect(page.locator('.hero-actions .button')).toHaveCSS('background-color', 'rgb(242, 102, 35)');
  await expect(page.locator('#hero-title')).toHaveCSS('color', 'rgb(53, 53, 53)');
  await expect(page.locator('#hero-title span')).toHaveCSS('color', 'rgb(8, 57, 89)');
  await expect(page.locator('#satellite-title')).toHaveCSS('font-weight', '700');
  await expect(page.locator('.mission-heading .section-intro')).toHaveCSS('font-weight', '400');
});

test('mobile menu opens, closes on Escape and follows section links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const toggle = page.locator('#menu-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.getByRole('navigation').getByRole('link', { name: 'Solutions', exact: true }).click();
  await expect(page).toHaveURL(/#solutions$/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('reduced motion keeps the scene still and all content readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#space-visual')).toHaveClass(/scene-ready/);
  await expect(page.locator('.flight-stage')).toHaveCSS('position', 'relative');
  const frame = fingerprint(await page.screenshot({ clip: { x: 780, y: 150, width: 600, height: 600 } }));
  await page.waitForTimeout(150);
  expect(fingerprint(await page.screenshot({ clip: { x: 780, y: 150, width: 600, height: 600 } }))).toEqual(frame);
  expect(await page.locator('[data-reveal]').evaluateAll(items => items.every(item => getComputedStyle(item).opacity === '1'))).toBe(true);
});

test('WebGL failure retains the satellite image and working controls', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (String(type).startsWith('webgl') || type === 'experimental-webgl') return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#motion-toggle')).toBeHidden();
  await expect(page.locator('#scene-fallback')).toHaveCSS('opacity', '1');
  await expect(page.locator('#scene-fallback img')).toBeVisible();
  await page.getByRole('tab', { name: 'Giza EG' }).click();
  await expect(page.locator('#image-location')).toHaveText('Giza, Egypt');
});

test('JavaScript disabled still exposes mission and real contact links', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:8080');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#scene-fallback img')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tell us about your project' })).toHaveAttribute('href', /^mailto:geospatial\.ai@uzmagroup\.com/);
  await context.close();
});

test('desktop and mobile have no serious accessibility violations or missing images', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const section of await page.locator('main > section').all()) {
      await section.scrollIntoViewIfNeeded();
    }
    await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
    expect(await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || !image.naturalWidth).map(image => image.src))).toEqual([]);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
  }
});


test('component explorer stays still and focuses selected hardware', async ({ page }) => {
  test.setTimeout(60000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const product=page.locator('[data-scene="product"]');
  const mount=product.locator('.aux-mount');
  await product.scrollIntoViewIfNeeded();
  await expect(product).toHaveClass(/scene-ready/, { timeout: 20000 });
  await expect(mount).toHaveAttribute('data-focus-moving','false');
  await expect(product.locator('.aux-fallback')).toHaveCSS('opacity','0');
  const initial=await product.screenshot();
  await page.waitForTimeout(250);
  await expectStill(initial, await product.screenshot());
  await page.locator('[data-component="camera"]').click();
  await expect(mount).toHaveAttribute('data-focus','camera');
  await expect(mount).toHaveAttribute('data-focus-moving','false');
  await expect(page.locator('#component-title')).toHaveText('Multispectral camera');
  expect(fingerprint(await product.screenshot())).not.toEqual(fingerprint(initial));
  await page.getByRole('button',{name:'Pause all motion',exact:true}).click();
  await expect(page.locator('[data-component]')).toHaveCount(11);
  for (const key of ['star-left','star-right','solar','aperture','barrel','body','patch-panel','small-panel','rear-bay','overview']) {
    await page.locator(`[data-component="${key}"]`).click();
    await expect(mount).toHaveAttribute('data-focus',key);
    await expect(mount).toHaveAttribute('data-focus-moving','false');
    await expect(page.locator(`[data-component="${key}"]`)).toHaveAttribute('aria-pressed','true');
  }
  await page.setViewportSize({ width:390, height:844 });
  await page.locator('[data-component="camera"]').click();
  await expect(mount).toHaveAttribute('data-focus','camera');
  await expect(product).toBeInViewport({ ratio:0.9 });
  await expect(page.locator('.angle-control,.mission-gallery,[data-scene="planet"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('appointment calendar opens on demand and restores keyboard focus', async ({ page }) => {
  await page.route('https://calendly.com/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Calendar integration</h1>' }));
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto('/');
  const trigger=page.locator('.contact-appointment');
  const dialog=page.getByRole('dialog');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.booking-frame iframe')).not.toHaveAttribute('src', /.+/);
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('.booking-frame iframe')).toHaveAttribute('src', /^https:\/\/calendly\.com\/media-geospatialai\/45mins/);
  await expect(page.getByRole('button',{name:'Close appointment calendar'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('button',{name:'Close appointment calendar'}).click();
  await expect(dialog).not.toBeVisible();
});

test('all news stories are available from the homepage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto('/#blog');
  await expect(page.locator('.journal-card')).toHaveCount(21);
  await page.locator('.journal-archive summary').click();
  await expect(page.locator('.journal-grid .journal-card').last()).toBeVisible();
  await page.locator('.journal-grid .journal-card').last().getByRole('link').click();
  await expect(page.locator('article')).toContainText('Satellogic');
});

test('all original product insight images and capability sections are available', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#imagery');
  await expect(page.locator('.insight-card')).toHaveCount(10);
  await expect(page.locator('.frontier-story')).toContainText('Satellogic');
  await expect(page.locator('.capability-grid')).toContainText('Tasking control capabilities');
  await expect(page.locator('.capability-grid')).toContainText('Calibration process');
  await expect(page.locator('.capacity-roadmap')).toContainText('7 revisits per day/site');
  await expect(page.locator('.capacity-roadmap')).toContainText('70 cm multispectral data');
  const gallery=page.locator('.insight-gallery');
  await gallery.scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'Next insight image'}).click();
  await expect.poll(()=>gallery.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await gallery.focus();
  await page.keyboard.press('End');
  await expect(page.locator('.insight-card').last()).toBeInViewport();
  await page.locator('.insight-card img').last().evaluate(image=>image.decode());
  await page.keyboard.press('Home');
  await expect(page.locator('.insight-card').first()).toBeInViewport();
  await expect(page.locator('.waiting-section a')).toHaveAttribute('href','https://uzmagroup.com/uzmasat-1/');
});
