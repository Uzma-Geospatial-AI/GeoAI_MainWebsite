const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const pages = require('../content/pages.json');

test('homepage readers can reach the complete content library and local service pages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore all content', exact: true }).click();
  await expect(page.locator('.library-section .card')).toHaveCount(36);
  await expect(page.locator('#news .card')).toHaveCount(18);
  await page.locator('a.card[href="satellite-imagery.html"]').click();
  await expect(page.locator('article')).toContainText('OPTICAL IMAGERY');
  await expect(page.locator('article')).toContainText('Sentosa');
  await expect(page.locator('article img')).toHaveCount(20);
});

test('new content pages remain readable and accessible on mobile', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of ['index', ...pages.map(p => p.slug)]) {
    const response = await page.goto(`/content/${slug}.html`);
    expect(response.status(), slug).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true);
    await expect(page.locator('[data-elementor-type], script[src*="wordpress"], link[href*="elementor"]')).toHaveCount(0);
  }
  for (const slug of ['index', 'about', 'satellite-imagery', 'contact-us']) {
    await page.goto(`/content/${slug}.html`);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations, slug).toEqual([]);
  }
});
