#!/usr/bin/env node
/**
 * Regenerates manifest.json as an accurate integrity snapshot of the deployed
 * site. The previous manifest was stale (wrong byte counts/hashes, a duplicate
 * index/404 entry and references to a non-existent legacy/ directory).
 *
 * Run after changing any deployed file:
 *   node tools/gen-manifest.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'manifest.json');
const skip = new Set(['manifest.json', '.gitattributes']);

function walk(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'tools') continue;
    if (entry.name.startsWith('_')) continue; // local backups / Jekyll-excluded directories
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    if (entry.isDirectory()) {
      files.push(...walk(absolute, relative));
    } else if (entry.isFile() && !skip.has(relative)) {
      const buffer = fs.readFileSync(absolute);
      files.push({
        path: relative,
        bytes: buffer.length,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex')
      });
    }
  }
  return files;
}

const entries = walk(root, '').sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2) + '\n', 'utf8');
console.log(`Regenerated manifest.json with ${entries.length} files.`);
