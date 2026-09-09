const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { createHash } = require('node:crypto');
const fingerprint = bytes => createHash('sha256').update(bytes).digest('hex');

test('satellite renders, responds to scroll and pauses', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#space-visual')).toHaveClass(/scene-ready/);
  await expect(page.locator('canvas.space-canvas')).toBeVisible();
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume animation', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(150);
  const pausedFrame = fingerprint(await page.screenshot({ clip: { x: 780, y: 150, width: 600, height: 600 } }));
  await page.waitForTimeout(200);
  expect(fingerprint(await page.screenshot({ clip: { x: 780, y: 150, width: 600, height: 600 } }))).toEqual(pausedFrame);
  await page.getByRole('button', { name: 'Resume animation', exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await expect(page.locator('#scene-caption')).toHaveText('Precision, from every angle.');
  await page.waitForTimeout(500);
  expect(fingerprint(await page.screenshot({ clip: { x: 780, y: 150, width: 600, height: 600 } }))).not.toEqual(pausedFrame);
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

test('industry selector updates the image, explanation and destination', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#solutions');
  await page.getByRole('button', { name: 'Urban Planning & Development' }).click();
  await expect(page.locator('#solution-title')).toHaveText('Urban Planning & Development');
  await expect(page.locator('#solution-link')).toHaveAttribute('href', 'https://www.uzmageoai.com/urban-planning-development/');
  await page.getByRole('button', { name: 'Ground Movement' }).click();
  await expect(page.locator('#solution-description')).toContainText('radar satellite data and InSAR');
  await expect(page.locator('#solution-image')).toHaveAttribute('src', 'assets/img/solutions/ground-movement.webp');
});

test('restored offerings and original brand palette stay complete', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#solutions');
  const buttons = page.locator('[data-solution]');
  await expect(buttons).toHaveCount(7);
  for (const button of await buttons.all()) {
    const title = await button.locator('span').nth(1).textContent();
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
  await expect(page.locator('.contact-appointment')).toHaveAttribute('href', 'https://wa.me/601156770921');
  await expect(page.locator('#services')).toHaveCSS('background-color', 'rgb(42, 62, 88)');
  await expect(page.locator('.hero-actions .button')).toHaveCSS('background-color', 'rgb(242, 101, 34)');
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
  await expect(page.getByRole('link', { name: 'Share more information with me' })).toHaveAttribute('href', /^mailto:geospatial\.ai@uzmagroup\.com/);
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


test('additional 3D scenes, manual rotation and global pause work', async ({ page }) => {
  // Software WebGL on CI needs more time to compile each lazy scene.
  test.setTimeout(60000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const product=page.locator('[data-scene="product"]');
  await product.scrollIntoViewIfNeeded();
  await expect(product).toHaveClass(/scene-ready/, { timeout: 20000 });
  await page.getByRole('button',{name:'Pause all motion',exact:true}).click();
  await expect(page.locator('body')).toHaveClass(/motion-paused/);
  const before=fingerprint(await product.screenshot());
  await page.getByRole('slider',{name:'Satellite viewing angle'}).fill('65');
  expect(fingerprint(await product.screenshot())).not.toEqual(before);
  const still=fingerprint(await product.screenshot());
  await page.waitForTimeout(200);
  expect(fingerprint(await product.screenshot())).toEqual(still);
  const planet=page.locator('[data-scene="planet"]');
  await planet.scrollIntoViewIfNeeded();
  await expect(planet).toHaveClass(/scene-ready/, { timeout: 20000 });
  const globe=fingerprint(await planet.screenshot());
  await page.waitForTimeout(200);
  expect(fingerprint(await planet.screenshot())).toEqual(globe);
  await page.getByRole('button',{name:'Resume all motion',exact:true}).click();
  await expect(page.locator('body')).not.toHaveClass(/motion-paused/);
  expect(errors).toEqual([]);
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
  await page.locator('.insight-card').last().scrollIntoViewIfNeeded();
  await expect(page.locator('.insight-card').last()).toBeInViewport();
  await page.locator('.insight-card img').last().evaluate(image=>image.decode());
  await expect(page.locator('.waiting-section a')).toHaveAttribute('href','https://uzmagroup.com/uzmasat-1/');
});
