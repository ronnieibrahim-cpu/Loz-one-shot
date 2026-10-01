import { chromium, devices } from 'playwright';
const OUT = process.argv[2];
const url = 'file:///home/user/Loz-one-shot/dist/oracle-of-tides.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const list = [
  ['iphone-se-portrait', devices['iPhone SE']],
  ['iphone-13-portrait', devices['iPhone 13']],
  ['pixel-7-portrait', devices['Pixel 7']],
  ['iphone-13-landscape', devices['iPhone 13 landscape']],
  ['pixel-7-landscape', devices['Pixel 7 landscape']],
  ['ipad-mini-portrait', devices['iPad Mini']],
];
for (const [name, dev] of list) {
  const ctx = await browser.newContext({ ...dev });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(url);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}-title.png` });
  // Start: tap the START button if present, else press Enter.
  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas'); const r = c.getBoundingClientRect();
    const btns = [...document.querySelectorAll('button, [data-key], .touch *')].filter(b => b.getBoundingClientRect().width > 0)
      .map(b => { const q = b.getBoundingClientRect(); return { t: (b.dataset.key || b.textContent || b.className).toString().slice(0, 12), x: Math.round(q.x), y: Math.round(q.y), w: Math.round(q.width), h: Math.round(q.height) }; });
    return { vw: innerWidth, vh: innerHeight, canvas: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, btns };
  });
  console.log(name, JSON.stringify(info));
  if (errs.length) console.log('  ERR', errs[0]);
  await ctx.close();
}
await browser.close();
