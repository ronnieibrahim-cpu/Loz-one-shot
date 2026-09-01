// Photograph Link in each of his states, facing each way.
//
// The bugs this exists for were both found by a person playing, not by any
// checker: pushing while facing the viewer drew Link's BACK (the ripper had
// `link_push_down` and `link_push_up` swapped), and the sword swing drew no
// sword at all (the sheet's slash poses are bodies only — the blade is a
// separate sprite, and nothing was drawing it). Both are `T53` exactly:
// every assertion passed the whole time, because the sprite existed, was
// found, and was drawn. It was simply the wrong picture.
//
// So this photographs the player himself, one state per shot, and a person
// looks. There is no assertion here worth making — "is this the right way
// round" is not a thing a checker can answer.
//
//   node tools/shoot-player.mjs                    # every state, every facing
//   node tools/shoot-player.mjs --shot-dir=/tmp/x
//
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
const ROOT = resolve(import.meta.dirname, '..');
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json' };
const shotDir = (process.argv.slice(2).find(a => a.startsWith('--shot-dir=')) || '').split('=')[1]
  || join(resolve(import.meta.dirname, '..'), 'tools/shots-player');
const server = createServer(async (req,res)=>{ try{
  const p = join(ROOT, decodeURIComponent(req.url.split('?')[0])==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));
  const b = await readFile(p); res.writeHead(200,{'Content-Type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);
}catch{res.writeHead(404);res.end('x');} });
await new Promise(r=>server.listen(0,r));
const port=server.address().port;
mkdirSync(shotDir,{recursive:true});
let browser; try{ browser=await chromium.launch(); }catch(e){ browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); }
const page=await browser.newPage({viewport:{width:480,height:432}});
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(()=>!!window.__game,{timeout:15000});
const frames=(n)=>page.evaluate((k)=>new Promise(res=>{const s=window.__game.frame;const t=()=>(window.__game.frame-s>=k)?res():requestAnimationFrame(t);t();}),n);
await page.keyboard.press('Enter'); await frames(6);
await page.keyboard.press('Enter'); await frames(20);
for(let i=0;i<140 && await page.evaluate(()=>window.__game.mode==='cutscene');i++){ await page.keyboard.press(i%2?'Enter':'x'); await frames(4); }
// --- pushing -------------------------------------------------------------
// `pushing` is a per-frame flag set by the movement code when Link walks into
// something solid, so it is pinned on the frame the shot is taken rather than
// staged with a real block: the thing under test is WHICH SPRITE the state
// picks, not how the state is entered.
for (const dir of ['down','up','right','left']) {
  await page.evaluate((d)=>{ const g=window.__game; g.mode='play';
    g.enterMap('overworld',0,4,7,80,72,'down',{instant:true});
    if(g.dialogue) g.dialogue.active=false; g.bannerTime=0; }, dir);
  await frames(12);
  await page.evaluate((d)=>{ const g=window.__game; g.player.dir=d; g.player.pushing=true; }, dir);
  await page.locator('canvas').screenshot({path: join(shotDir,`push-${dir}.png`)});
}

for (const dir of ['down','up','right','left']) {
  for (const at of [3,6]) {
    await page.evaluate((d)=>{ const g=window.__game; g.mode='play';
      g.enterMap('overworld',0,4,7,80,72,'down',{instant:true});
      if(g.dialogue) g.dialogue.active=false; g.bannerTime=0;
      g.progress.items.sword=Math.max(1,g.progress.items.sword||0);
      g.player.dir=d; g.player.swinging=0; }, dir);
    await frames(12);
    await page.evaluate((d)=>{ window.__game.player.dir=d; }, dir);
    await page.keyboard.down('KeyX'); await frames(at); 
    await page.locator('canvas').screenshot({path: join(shotDir,`swing-${dir}-f${at}.png`)});
    await page.keyboard.up('KeyX'); await frames(20);
  }
}
await browser.close(); server.close();
console.log('wrote swing shots to', shotDir);
