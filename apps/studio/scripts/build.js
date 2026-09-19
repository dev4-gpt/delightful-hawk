/**
 * @aetheris/studio - build.js
 * Production asset verification and distribution bundler.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- [Aetheris World Studio] Production Build & Asset Verification ---');

const requiredFiles = [
  path.join(rootDir, 'public', 'index.html'),
  path.join(rootDir, 'src', 'studioStyles.css'),
  path.join(rootDir, 'src', 'studioApp.js'),
  path.join(rootDir, 'server.js'),
  path.join(rootDir, 'package.json')
];

let allValid = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    console.log(`✔ Verified: ${path.relative(rootDir, file)} (${stat.size} bytes)`);
  } else {
    console.error(`✖ Missing required asset: ${file}`);
    allValid = false;
  }
}

if (!allValid) {
  process.exit(1);
}

console.log('🎉 Production build verification completed successfully.');
