// Build docs/guide/index.html: the player's guide as ONE self-contained file.
//
// The source is tools/guide/guide.html — plain HTML with two small tags:
//   <fig src="name" alt="...">caption</fig>   a picture from docs/guide/img/
//   <figs> ... </figs>                        pictures side by side
// Every picture is inlined as a data: URI, so the page opens straight from the
// file on a phone with no server and no network, and the same file publishes
// as an Artifact unchanged. The contents menu is built from the h2/h3 ids.
//
//   node tools/guide/build.mjs [--out=docs/guide/index.html] [--linked]
// --linked writes <img src="img/..."> instead of inlining (for quick checks).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const OUT = resolve(opt('out', join(ROOT, 'docs/guide/index.html')));
const IMG = join(ROOT, 'docs/guide/img');
const linked = args.includes('--linked');

let src = readFileSync(join(HERE, 'guide.html'), 'utf8');
const shell = readFileSync(join(HERE, 'shell.html'), 'utf8');

function pngSize(buf) { return [buf.readUInt32BE(16), buf.readUInt32BE(20)]; }
const missing = [];
let bytes = 0;
src = src.replace(/<fig\s+src="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+class="([^"]*)")?\s*>([\s\S]*?)<\/fig>/g, (all, name, alt, cls, cap) => {
  const file = join(IMG, name + '.png');
  if (!existsSync(file)) { missing.push(name); return `<p class="missing">[missing picture: ${name}]</p>`; }
  const buf = readFileSync(file);
  const [w, h] = pngSize(buf);
  bytes += buf.length;
  const url = linked ? `img/${name}.png` : 'data:image/png;base64,' + buf.toString('base64');
  const a = (alt || cap.replace(/<[^>]+>/g, '')).replace(/"/g, '&quot;').trim();
  return `<figure class="shot${cls ? ' ' + cls : ''}"><button class="zoom" type="button" aria-label="Enlarge picture"><img src="${url}" width="${w}" height="${h}" alt="${a}" loading="lazy" decoding="async"></button>${cap.trim() ? `<figcaption>${cap.trim()}</figcaption>` : ''}</figure>`;
});
src = src.replace(/<figs>/g, '<div class="figs">').replace(/<\/figs>/g, '</div>');

// Contents: every h2 (chapter) and h3 (section) that carries an id.
const toc = [];
for (const m of src.matchAll(/<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)) {
  toc.push({ lvl: +m[1], id: m[2], text: m[3].replace(/<span class="(ch|room)">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim() });
}
let tocHtml = '<ol class="toc">';
let open = false;
for (const t of toc) {
  if (t.lvl === 2) {
    if (open) tocHtml += '</ol></li>';
    tocHtml += `<li><a href="#${t.id}">${t.text}</a><ol>`;
    open = true;
  } else tocHtml += `<li><a href="#${t.id}">${t.text}</a></li>`;
}
if (open) tocHtml += '</ol></li>';
tocHtml += '</ol>';

const html = shell.replace('<!--TOC-->', tocHtml).replace('<!--CONTENT-->', src);
writeFileSync(OUT, html);
console.log(`wrote ${OUT}: ${(html.length / 1024).toFixed(0)} KB, ${(bytes / 1024).toFixed(0)} KB of pictures, ${toc.length} headings`);
if (missing.length) { console.log('MISSING pictures: ' + missing.join(', ')); process.exitCode = 1; }
