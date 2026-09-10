const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const crypto=require('node:crypto');
const documents=require('../content/documents.json');
const pages=require('../content/pages.json');
const AxeBuilder=require('@axe-core/playwright').default;
test('new editorial scroll motion responds and honours pause',async({page})=>{
 await page.goto('/');
 const photo=page.locator('.journal-lead .journal-photo img').first();
 await photo.scrollIntoViewIfNeeded();
 await expect.poll(()=>photo.evaluate(el=>getComputedStyle(el).transform)).not.toBe('none');
 await page.getByRole('button',{name:'Pause all motion',exact:true}).click();
 await expect(photo).toHaveCSS('transform','none');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(photo).toHaveCSS('transform','none');
});
test('all supplied source pages, text blocks and embedded images survive publication',async({page})=>{
  test.setTimeout(90000);
  expect(documents.units).toHaveLength(20);
  const used=new Set();
  for(const source of Object.values(documents.sources))expect(fs.existsSync('redesign/'+source.file)).toBe(false);
  for(const unit of documents.units){
    const entry=pages.find(p=>p.documentUnit===unit.id);expect(entry,unit.id).toBeTruthy();
    await page.goto('/content/'+entry.slug+'.html');
    await expect(page.locator('a[href$=".pdf"],a[href$=".pptx"],.source-download')).toHaveCount(0);
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
 await expect(page.locator('a[href$=".pdf"],a[href$=".pptx"],.resource-downloads')).toHaveCount(0);
 await expect(page.locator('.resource-grid .document-card')).toHaveCount(20);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});
