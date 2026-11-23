#!/usr/bin/env node
/**
 * GitHub Pages serves 404.html for unknown paths. To make SPA deep links such
 * as /about, /01_about or /01_about.html work without a redirect stub,
 * 404.html must be a
 * complete mirror of index.html: the app reads location.pathname itself and
 * loads the matching content fragment.
 *
 * Run after every change to index.html:
 *   node tools/sync-404.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'index.html');
const target = path.join(root, '404.html');
const doctype = '<!DOCTYPE html>';
const marker =
  '\n<!-- AUTO-GENERATED MIRROR of index.html - regenerate with: node tools/sync-404.js -->';

const html = fs.readFileSync(source, 'utf8');

if (!html.startsWith(doctype)) {
  throw new Error('index.html does not start with <!DOCTYPE html>');
}
if (!/<base\s+href="\/"/i.test(html)) {
  throw new Error('index.html is missing the root <base href="/"> element');
}

const mirror = html.slice(0, doctype.length) + marker + html.slice(doctype.length);
fs.writeFileSync(target, mirror, 'utf8');

console.log(`Synchronized 404.html from index.html (${Buffer.byteLength(mirror)} bytes).`);
