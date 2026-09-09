const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const crypto=require('node:crypto');
const documents=require('../content/documents.json');
const pages=require('../content/pages.json');
const AxeBuilder=require('@axe-core/playwright').default;
test('all supplied source pages, text blocks and embedded images survive publication',async({page})=>{
  test.setTimeout(90000);
  expect(documents.units).toHaveLength(20);
  const used=new Set();
  for(const source of Object.values(documents.sources))expect(crypto.createHash('sha256').update(fs.readFileSync('redesign/'+source.file)).digest('hex')).toBe(source.sha256);
  for(const unit of documents.units){
    const entry=pages.find(p=>p.documentUnit===unit.id);expect(entry,unit.id).toBeTruthy();
    await page.goto('/content/'+entry.slug+'.html');
    const text=await page.locator('article').textContent();
    for(const block of unit.blocks)expect(text.replace(/\s+/g,' '),unit.id).toContain(block.text.replace(/\s+/g,' '));
    expect(fs.existsSync('redesign/'+unit.preview)).toBe(true);
    for(const key of unit.images){used.add(key);const asset=documents.assets[key];expect(entry.html).toContain(asset.src);expect(fs.existsSync('redesign/'+asset.src)).toBe(true);expect(crypto.createHash('sha256').update(fs.readFileSync('redesign/'+asset.original)).digest('hex')).toBe(asset.hash);}
  }
  expect([...used].sort()).toEqual(Object.keys(documents.assets).sort());
});
test('new document chapters and collection remain accessible',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 for(const slug of ['brochure-03','presentation-04','presentation-01']){
  await page.goto('/content/'+slug+'.html');
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
 }
 await page.goto('/');await page.locator('#document-library summary').click();
 await expect(page.locator('.resource-grid .document-card')).toHaveCount(20);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});
