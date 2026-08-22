// build.mjs — bundle index.html plus every ES module under src/ into one
// self-contained HTML file that runs from a file:// URL.
//
// Why this is possible at all: the game loads nothing at runtime. Sprites are
// procedural JS, audio is WebAudio synthesis, room data is JS literals. There
// is no fetch, no XMLHttpRequest, no new Image, no <img>/<audio> tag. The
// bundle asserts that (see assertNoRuntimeAssets) and refuses to build if it
// ever stops being true.
//
// Why a classic <script> rather than <script type="module">: a module script
// loaded from file:// is fetched with an opaque origin and blocked by CORS in
// every browser, even when it is inline and its imports are gone. A classic
// script has no such restriction. So the module graph is flattened into a tiny
// synchronous registry — each module becomes a function that fills an exports
// object, and __require pulls them in dependency order.
//
// No bundler dependency: this file is the bundler, and it is plain Node.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const ENTRY = join(SRC, 'main.js');
const OUT = join(ROOT, 'dist', 'oracle-of-tides.html');

const die = (msg) => { console.error('build: ' + msg); process.exit(1); };

// ---------------------------------------------------------------------------
// Guard: the no-runtime-assets claim
// ---------------------------------------------------------------------------

// Comments carry provenance notes naming reference sheets ("… — foo.png @
// 1611,307"), and room grids are strings of tile letters that can spell an
// extension by accident. So the scan runs over code with comments and string
// literals blanked out.
function stripCommentsAndStrings(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') { out += ' '; i++; }
    } else if (c === '/' && src[i + 1] === '*') {
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { out += src[i] === '\n' ? '\n' : ' '; i++; }
      out += '  '; i += 2;
    } else if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      out += ' '; i++;
      while (i < n) {
        if (src[i] === '\\') { out += '  '; i += 2; continue; }
        if (src[i] === quote) { out += ' '; i++; break; }
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
    } else {
      out += c; i++;
    }
  }
  return out;
}

// `shadow` names a global that the codebase legitimately shadows with its own
// declaration — src/core/audio.js defines `class Audio`, the WebAudio synth, so
// `new Audio()` there is not a media element fetching a file.
const ASSET_PATTERNS = [
  [/\bfetch\s*\(/, 'fetch('],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bnew\s+Image\b/, 'new Image', 'Image'],
  [/\bnew\s+Audio\b/, 'new Audio', 'Audio'],
  [/\bcreateImageBitmap\b/, 'createImageBitmap'],
  [/\bimportScripts\b/, 'importScripts'],
  [/\bnavigator\s*\.\s*sendBeacon\b/, 'sendBeacon'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bEventSource\b/, 'EventSource'],
  [/\bdecodeAudioData\b/, 'decodeAudioData'],
  [/\.(png|jpe?g|gif|bmp|webp|wav|mp3|ogg|json|bin|ttf|woff2?)\b/i, 'an asset file reference'],
];

function assertNoRuntimeAssets(modules, html) {
  const offences = [];
  for (const m of modules) {
    const code = stripCommentsAndStrings(m.source);
    for (const [re, label, shadow] of ASSET_PATTERNS) {
      if (shadow && new RegExp(`\\b(?:class|function|const|let|var)\\s+${shadow}\\b`).test(code)) continue;
      const line = code.split('\n').findIndex(l => re.test(l));
      if (line >= 0) offences.push(`${relative(ROOT, m.file)}:${line + 1}: ${label}`);
    }
  }
  // In the HTML only markup that pulls a resource matters; the inline error
  // shim, the touch layer and a data: URI (the manifest link, the
  // apple-touch-icon — see tools/gen-app-icon.mjs) are pure DOM, not a
  // network load.
  const tagRe = /<(img|audio|video|source|link|object|embed)\b[^>]*\b(src|href)\s*=\s*(["'])([^"']*)\3/gi;
  let tag;
  while ((tag = tagRe.exec(html))) {
    if (!tag[4].startsWith('data:')) offences.push(`index.html: <${tag[1]}> loads a resource (${tag[4]})`);
  }

  if (offences.length) {
    die(
      'the game now loads something at runtime, so it cannot be inlined into a\n' +
      'single file:// document. Offending sites:\n  ' + offences.join('\n  ') +
      '\nFix the load or teach the build to embed it; do not work around this.'
    );
  }
}

// ---------------------------------------------------------------------------
// Module graph
// ---------------------------------------------------------------------------

const idOf = (file) => relative(SRC, file).split('\\').join('/');

// Matches `import { a, b as c } from './x.js';`, including the multi-line form.
// Statement-anchored: an import must start a line, which is true throughout and
// is enforced below.
const IMPORT_RE = /^[ \t]*import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]\s*;?[ \t]*$/gm;

function parseImports(m) {
  const deps = [];
  const stripped = m.source.replace(IMPORT_RE, (whole, names, spec) => {
    if (!spec.startsWith('.')) die(`${idOf(m.file)}: bare import "${spec}"; the bundle has no package resolution`);
    const target = resolve(dirname(m.file), spec);
    const bindings = names.split(',').map(s => s.trim()).filter(Boolean).map(part => {
      const as = part.split(/\s+as\s+/);
      if (as.length === 2) return `${as[0].trim()}: ${as[1].trim()}`;
      if (as.length === 1) return as[0].trim();
      die(`${idOf(m.file)}: cannot parse import binding "${part}"`);
    });
    deps.push(target);
    // Destructuring snapshots the binding. That is safe here because every
    // export in src/ is a const, function or class — nothing is reassigned —
    // and the graph is proven acyclic below, so the dependency has finished
    // evaluating before this line runs.
    const decl = bindings.length ? `const { ${bindings.join(', ')} } = ` : '';
    return `${decl}__require(${JSON.stringify(idOf(target))});`;
  });

  // Anything left that looks like an import is a form this bundler does not
  // understand. Failing loudly beats emitting a file that is subtly wrong.
  const leftover = /^[ \t]*import\b(?!\s*\()/m.exec(stripCommentsAndStrings(stripped));
  if (leftover) {
    const line = stripCommentsAndStrings(stripped).slice(0, leftover.index).split('\n').length;
    die(`${idOf(m.file)}:${line}: unsupported import form (only \`import { … } from './x.js'\` is handled)`);
  }
  if (/\bimport\s*\(/.test(stripCommentsAndStrings(stripped))) {
    die(`${idOf(m.file)}: dynamic import(); a single classic script cannot honour it`);
  }
  m.code = stripped;
  m.deps = deps;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// `export const A = 1, B = 2;` would publish only A under the transform below,
// so refuse it. Scans the comment- and string-free code, tracking bracket depth
// so a comma inside an object or array literal is not mistaken for a second
// declarator.
function assertSingleDeclarator(m) {
  const code = stripCommentsAndStrings(m.code);
  const re = /^[ \t]*export\s+(?:const|let|var)\s/gm;
  let match;
  while ((match = re.exec(code))) {
    let depth = 0;
    for (let i = match.index + match[0].length; i < code.length; i++) {
      const c = code[i];
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      else if (depth === 0 && c === ';') break;
      else if (depth === 0 && c === ',') {
        const line = code.slice(0, i).split('\n').length;
        die(`${idOf(m.file)}:${line}: multi-declarator export; split it into one \`export\` per binding`);
      }
    }
  }
}

function transformExports(m) {
  assertSingleDeclarator(m);
  const names = new Set();

  let code = m.code.replace(
    /^[ \t]*export\s+(async\s+function\s*\*?|function\s*\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
    (whole, kind, name) => { names.add(name); return whole.replace(/^([ \t]*)export\s+/, '$1'); }
  );

  code = code.replace(/^[ \t]*export\s*\{([^}]*)\}\s*;?[ \t]*$/gm, (whole, list) => {
    for (const part of list.split(',').map(s => s.trim()).filter(Boolean)) {
      const as = part.split(/\s+as\s+/);
      const local = as[0].trim();
      const exported = (as[1] || as[0]).trim();
      if (local !== exported) names.add(`${exported} = ${local}`);
      else names.add(local);
    }
    return '';
  });

  const leftover = /^[ \t]*export\b/m.exec(stripCommentsAndStrings(code));
  if (leftover) {
    const line = stripCommentsAndStrings(code).slice(0, leftover.index).split('\n').length;
    die(`${idOf(m.file)}:${line}: unsupported export form (no default, star or re-export is handled)`);
  }

  m.code = code;
  m.exports = [...names];
}

// ---------------------------------------------------------------------------
// Walk, sort, emit
// ---------------------------------------------------------------------------

function loadGraph() {
  const modules = new Map();
  const walk = (file) => {
    const id = idOf(file);
    if (modules.has(id)) return modules.get(id);
    let source;
    try { source = readFileSync(file, 'utf8'); }
    catch { die(`cannot read ${relative(ROOT, file)} (imported module missing)`); }
    const m = { file, id, source };
    modules.set(id, m);
    parseImports(m);
    transformExports(m);
    for (const dep of m.deps) walk(dep);
    return m;
  };
  walk(ENTRY);
  return modules;
}

// Depth-first topological order, with a cycle check. A cycle would break the
// destructuring-import strategy (the importer would snapshot undefined), so it
// is a hard error rather than something to paper over.
function topoSort(modules) {
  const order = [];
  const state = new Map();   // id -> 'open' | 'done'
  const stack = [];
  const visit = (id) => {
    const s = state.get(id);
    if (s === 'done') return;
    if (s === 'open') {
      die('import cycle: ' + [...stack.slice(stack.indexOf(id)), id].join(' -> ') +
          '\nThe bundle evaluates modules in dependency order and cannot express a cycle.');
    }
    state.set(id, 'open');
    stack.push(id);
    for (const dep of modules.get(id).deps) visit(idOf(dep));
    stack.pop();
    state.set(id, 'done');
    order.push(id);
  };
  visit(idOf(ENTRY));
  return order.map(id => modules.get(id));
}

function everySrcModuleReached(modules) {
  const all = [];
  const walkDir = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walkDir(p);
      else if (name.endsWith('.js')) all.push(idOf(p));
    }
  };
  walkDir(SRC);
  return all.filter(id => !modules.has(id));
}

function emit(order) {
  const parts = [];
  parts.push('(function () {');
  parts.push('"use strict";');
  parts.push('var __modules = Object.create(null);');
  parts.push('function __define(id, fn) { __modules[id] = { fn: fn, exports: null }; }');
  parts.push('function __require(id) {');
  parts.push('  var m = __modules[id];');
  parts.push('  if (!m) throw new Error("bundle: unknown module " + id);');
  parts.push('  if (!m.exports) { m.exports = {}; m.fn(m.exports, __require); }');
  parts.push('  return m.exports;');
  parts.push('}');

  for (const m of order) {
    parts.push('');
    parts.push(`/* ===== src/${m.id} ===== */`);
    parts.push(`__define(${JSON.stringify(m.id)}, function (__exports, __require) {`);
    parts.push(m.code.replace(/\s+$/, ''));
    for (const name of m.exports) {
      const [exported, local] = name.includes('=') ? name.split('=').map(s => s.trim()) : [name, name];
      parts.push(`__exports[${JSON.stringify(exported)}] = ${local};`);
    }
    parts.push('});');
  }

  parts.push('');
  parts.push(`__require(${JSON.stringify(idOf(ENTRY))});`);
  parts.push('})();');
  return parts.join('\n');
}

// ---------------------------------------------------------------------------

function main() {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

  const modules = loadGraph();
  assertNoRuntimeAssets([...modules.values()], html);

  const unreached = everySrcModuleReached(modules);
  if (unreached.length) {
    console.warn('build: not reachable from src/main.js, so not bundled:\n  ' + unreached.join('\n  '));
  }

  const order = topoSort(modules);
  const bundle = emit(order);

  // Replace the module <script> tag with the flattened classic one. Everything
  // else in index.html — the styles, the boot overlay, the error shim and the
  // whole touch control layer — is carried through untouched, so the built file
  // is playable on a phone as well as a desktop.
  const TAG = /<script\s+type=["']module["']\s+src=["'][^"']+["']\s*>\s*<\/script>/;
  if (!TAG.test(html)) die('index.html no longer has a <script type="module" src="…"> tag to replace');
  const out = html.replace(TAG, () =>
    '<script>\n' +
    '// Bundled by tools/build.mjs — every module under src/ inlined in dependency\n' +
    '// order as one classic script, so this file runs from file:// with no server.\n' +
    bundle.replace(/<\/script/gi, '<\\/script') +
    '\n</script>'
  );

  if (!/id="touch"/.test(out)) die('the touch control layer did not survive the bundle');

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out);

  const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
  console.log(`build: ${order.length} modules -> ${relative(ROOT, OUT)} (${kb} KB)`);
}

main();
