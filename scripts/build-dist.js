import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const chromeDir = path.join(rootDir, 'dist-chrome');
const firefoxDir = path.join(rootDir, 'dist-firefox');
const manifestDir = path.join(rootDir, 'manifests');

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 1. Clean previous browser builds
if (fs.existsSync(chromeDir)) fs.rmSync(chromeDir, { recursive: true, force: true });
if (fs.existsSync(firefoxDir)) fs.rmSync(firefoxDir, { recursive: true, force: true });

// 2. Copy 'dist' to both targets
console.log('Creating dist-chrome...');
copyDir(distDir, chromeDir);

console.log('Creating dist-firefox...');
copyDir(distDir, firefoxDir);

// 3. Overwrite manifests (and they won't have extra copies anymore)
console.log('Applying Chrome manifest...');
fs.copyFileSync(
    path.join(manifestDir, 'chrome.json'),
    path.join(chromeDir, 'manifest.json')
);

console.log('Applying Firefox manifest...');
fs.copyFileSync(
    path.join(manifestDir, 'firefox.json'),
    path.join(firefoxDir, 'manifest.json')
);

// 4. CLEANUP: Remove the intermediate dist folder and any extra manifests copied by Vite
console.log('Cleaning up intermediate files...');
fs.rmSync(distDir, { recursive: true, force: true });

// Optional: If there's a stale manifest.json in public, we should delete it from the outputs
// but moving them to /manifests already prevents this.

console.log('✅ Build complete!');
console.log('  Chrome:  ./dist-chrome');
console.log('  Firefox: ./dist-firefox');