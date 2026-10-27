import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(projectRoot, '../..');

const publicTesseractDir = path.join(projectRoot, 'public', 'tesseract');
const coreTargetDir = path.join(publicTesseractDir, 'core');
const langTargetDir = path.join(publicTesseractDir, 'lang');

// Ensure directories exist
fs.mkdirSync(coreTargetDir, { recursive: true });
fs.mkdirSync(langTargetDir, { recursive: true });

// 1. Locate and copy worker.min.js
function findFile(relPath) {
  const localPath = path.join(projectRoot, 'node_modules', relPath);
  if (fs.existsSync(localPath)) return localPath;
  const hoistedPath = path.join(monorepoRoot, 'node_modules', relPath);
  if (fs.existsSync(hoistedPath)) return hoistedPath;
  throw new Error(`Could not find ${relPath} in local or hoisted node_modules`);
}

const workerSrc = findFile('tesseract.js/dist/worker.min.js');
const workerDest = path.join(publicTesseractDir, 'worker.min.js');
fs.copyFileSync(workerSrc, workerDest);
console.log(`[setup-tesseract] Copied worker.min.js -> public/tesseract/worker.min.js (${fs.statSync(workerDest).size} bytes)`);

// 2. Locate and copy tesseract.js-core files
function findDir(relPath) {
  const localPath = path.join(projectRoot, 'node_modules', relPath);
  if (fs.existsSync(localPath)) return localPath;
  const hoistedPath = path.join(monorepoRoot, 'node_modules', relPath);
  if (fs.existsSync(hoistedPath)) return hoistedPath;
  throw new Error(`Could not find directory ${relPath}`);
}

const coreDir = findDir('tesseract.js-core');
const coreFiles = fs.readdirSync(coreDir).filter(f => f.startsWith('tesseract-core'));
let coreCopiedCount = 0;
for (const file of coreFiles) {
  const src = path.join(coreDir, file);
  const dest = path.join(coreTargetDir, file);
  fs.copyFileSync(src, dest);
  coreCopiedCount++;
}
console.log(`[setup-tesseract] Copied ${coreCopiedCount} core binaries/scripts -> public/tesseract/core/`);

// 3. Download / ensure eng.traineddata.gz and decompressed eng.traineddata
const langGzDest = path.join(langTargetDir, 'eng.traineddata.gz');
const langUncompressedDest = path.join(langTargetDir, 'eng.traineddata');

async function ensureLangData() {
  if (!fs.existsSync(langGzDest) || fs.statSync(langGzDest).size < 1000000) {
    console.log('[setup-tesseract] Fetching pinned eng.traineddata.gz for on-device OCR...');
    const url = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz';
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to download traineddata from ${url}: status ${resp.status}`);
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(langGzDest, buffer);
    console.log(`[setup-tesseract] Saved eng.traineddata.gz (${buffer.length} bytes)`);
  } else {
    console.log('[setup-tesseract] Existing eng.traineddata.gz verified.');
  }

  // Decompress into uncompressed .traineddata as well so either format works seamlessly
  if (!fs.existsSync(langUncompressedDest) || fs.statSync(langUncompressedDest).size < 1000000) {
    const gzData = fs.readFileSync(langGzDest);
    const uncompressed = zlib.gunzipSync(gzData);
    fs.writeFileSync(langUncompressedDest, uncompressed);
    console.log(`[setup-tesseract] Extracted eng.traineddata (${uncompressed.length} bytes)`);
  } else {
    console.log('[setup-tesseract] Existing eng.traineddata verified.');
  }
}

await ensureLangData();
console.log('[setup-tesseract] Tesseract on-device OCR assets successfully set up in public/tesseract/!');
