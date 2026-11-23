#!/usr/bin/env node
/**
 * Static integrity check for the Lightning Horn Unicorn site.
 *   node tools/verify.js
 *
 * Checks: inline JS syntax, CSS brace balance, duplicate IDs, fragment shape,
 * local asset references, 404 mirror consistency and manifest accuracy.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const problems = [];
const notes = [];
const fail = (m) => problems.push(m);
const ok = (m) => notes.push(m);

/* ---------- 1. inline + tool JavaScript syntax ---------- */
const html = read('index.html');
const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let scriptCount = 0;
const tmpFiles = [];
const scriptSources = ['index.html', 'downloads.html',
  'txt/about.txt', 'txt/vhsmultiverse.txt', 'txt/humanart.txt', 'txt/projects.txt',
  'txt/storytime.txt', 'txt/music.txt', 'txt/contact.txt', 'txt/donate.txt'];
for (const source of scriptSources) {
  if (!fs.existsSync(path.join(root, source))) continue;
  const sourceHtml = read(source);
  scriptRe.lastIndex = 0;
  let localIndex = 0;
  while ((match = scriptRe.exec(sourceHtml))) {
    const attrs = match[1] || '';
    const code = match[2] || '';
    if (/type\s*=\s*["']importmap["']/i.test(attrs)) continue;
    if (!code.trim()) continue;
    localIndex += 1;
    scriptCount += 1;
    const isModule = /type\s*=\s*["']module["']/i.test(attrs);
    const ext = isModule ? '.mjs' : '.js';
    const tmp = path.join(os.tmpdir(), `lhu-verify-${process.pid}-${scriptCount}${ext}`);
    fs.writeFileSync(tmp, code, 'utf8');
    tmpFiles.push(tmp);
    try {
      execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
    } catch (error) {
      fail(`${source} inline script #${localIndex}: ${String(error.stderr || error.message).split('\n')[0]}`);
    }
  }
}
for (const file of ['tools/sync-404.js', 'tools/gen-manifest.js', 'tools/verify.js']) {
  if (!fs.existsSync(path.join(root, file))) continue;
  try {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  } catch (error) {
    fail(`${file}: ${String(error.stderr || error.message).split('\n')[0]}`);
  }
}
tmpFiles.forEach((f) => { try { fs.unlinkSync(f); } catch (_) {} });
ok(`${scriptCount} inline scripts parsed without syntax errors`);

/* ---------- 2. CSS brace balance ---------- */
const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
let styleCount = 0;
while ((match = styleRe.exec(html))) {
  styleCount += 1;
  const css = match[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const open = (css.match(/\{/g) || []).length;
  const close = (css.match(/\}/g) || []).length;
  if (open !== close) fail(`index.html <style> #${styleCount}: ${open} '{' vs ${close} '}'`);
}
ok(`${styleCount} inline style blocks have balanced braces`);

/* ---------- 3. duplicate IDs ---------- */
const ids = [...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
const seen = new Set();
const dupes = new Set();
ids.forEach((id) => (seen.has(id) ? dupes.add(id) : seen.add(id)));
if (dupes.size) fail(`duplicate IDs in index.html: ${[...dupes].join(', ')}`);
else ok(`${ids.length} IDs in index.html, no duplicates`);

/* ---------- 4. fragment masters ---------- */
const fragments = ['about', 'vhsmultiverse', 'humanart', 'projects',
  'storytime', 'music', 'contact', 'donate'].map((n) => `txt/${n}.txt`);
for (const file of fragments) {
  if (!fs.existsSync(path.join(root, file))) { fail(`missing content master: ${file}`); continue; }
  const text = read(file);
  if (!/<main\b/i.test(text)) fail(`${file}: no <main> element`);
  if (!/<!DOCTYPE html>/i.test(text)) fail(`${file}: no DOCTYPE`);
}
ok(`${fragments.length} content masters present and well shaped`);

/* ---------- 5. local references ---------- */
const sources = ['index.html', '404.html', ...fragments];
const refs = new Map();
for (const file of sources) {
  const text = read(file);
  const lines = text.split('\n');
  const patterns = [
    /(?:src|href|data-src)\s*=\s*["']([^"']+)["']/gi,
    /url\(\s*["']([^"']+)["']\s*\)/g
  ];
  lines.forEach((line, i) => {
    patterns.forEach((re) => {
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(line))) {
        let ref = m[1].split('#')[0].split('?')[0];
        if (!ref || /^(https?:|mailto:|data:|#|\/\/)/i.test(ref) || ref.includes('${')) continue;
        if (ref.startsWith('/')) ref = ref.slice(1);
        if (!ref) continue;
        if (!refs.has(ref)) refs.set(ref, []);
        refs.get(ref).push(`${file}:${i + 1}`);
      }
    });
  });
}
let missing = 0;
for (const [ref, where] of refs) {
  if (!fs.existsSync(path.join(root, ref))) {
    missing += 1;
    fail(`missing local asset "${ref}" referenced by ${where.slice(0, 3).join(', ')}`);
  }
}
ok(`${refs.size} distinct local references checked, ${missing} missing`);

/* ---------- 6. 404 mirror ---------- */
const mirror = read('404.html');
if (!/<base\s+href="\/"/i.test(mirror)) fail('404.html: missing root <base href="/">');
const marker = '\n<!-- AUTO-GENERATED MIRROR of index.html - regenerate with: node tools/sync-404.js -->';
if (!mirror.includes(marker)) fail('404.html: missing auto-generated marker');
const stripped = mirror.replace(marker, '');
if (stripped !== html) fail('404.html is out of sync with index.html - run node tools/sync-404.js');
else ok('404.html is an exact mirror of index.html');

/* ---------- 7. manifest accuracy ---------- */
if (fs.existsSync(path.join(root, 'manifest.json'))) {
  const manifest = JSON.parse(read('manifest.json'));
  let bad = 0;
  for (const entry of manifest) {
    const target = path.join(root, entry.path);
    if (!fs.existsSync(target)) { fail(`manifest entry points to missing file: ${entry.path}`); bad += 1; continue; }
    const buffer = fs.readFileSync(target);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    if (buffer.length !== entry.bytes || hash !== entry.sha256) {
      fail(`manifest stale for ${entry.path}`); bad += 1;
    }
  }
  if (!bad) ok(`manifest.json matches all ${manifest.length} listed files`);
}

/* ---------- report ---------- */
console.log(notes.map((n) => `  OK   ${n}`).join('\n'));
if (problems.length) {
  console.log(problems.map((p) => `  FAIL ${p}`).join('\n'));
  console.log(`\n${problems.length} problem(s) found.`);
  process.exitCode = 1;
} else {
  console.log('\nAll checks passed.');
}
