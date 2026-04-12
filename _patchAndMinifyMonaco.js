import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const monacoEsm = './node_modules/monaco-editor/esm';
const outDir = `${monacoEsm}/vs/editor`;
const absOutDir = path.resolve(outDir);

// --- Patch: remove CSS imports (esbuild can't handle them) ---
function walkDir(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, callback);
    } else if (entry.isFile() && full.endsWith('.js')) {
      callback(full);
    }
  }
}

function removeCssImports(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const content = original.replace(/^\s*import\s+[^;]*['"]([^'"]+\.css)['"]\s*;?\s*$/gm, '');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned:', filePath);
  }
}

walkDir(path.resolve(monacoEsm), removeCssImports);
fs.rmSync('./node_modules/monaco-editor/dev', { recursive: true, force: true });

// --- Patch: fix shadow DOM mouse event handling ---
const mouseHandlerPath = `${monacoEsm}/vs/editor/browser/controller/mouseHandler.js`;
const mouseHandlerCode = fs.readFileSync(mouseHandlerPath, 'utf8');
const patchedMouseHandler = mouseHandlerCode.replace(
  /this\.viewHelper\.viewDomNode\.contains\(e\.target\)/,
  'this.viewHelper.viewDomNode.contains(e.composedPath()[0])'
);
if (patchedMouseHandler !== mouseHandlerCode) {
  fs.writeFileSync(mouseHandlerPath, patchedMouseHandler);
  console.log('Patched monaco editor mouseHandler');
}

// --- Bundle: main editor ---
await esbuild.build({
  entryPoints: [`${monacoEsm}/vs/editor/editor.main.js`],
  outdir: outDir,
  entryNames: 'editor.main.min',
  bundle: true,
  minify: true,
  splitting: true,
  format: 'esm',
  platform: 'neutral',
  external: ['dompurify'],
}).catch(() => process.exit(1));

// --- Bundle: language workers ---
// Find all *.worker.js files outside outDir and bundle them there so that
// import.meta.url-relative paths in the split chunks resolve correctly.
function findWorkers(dir) {
  const workers = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      workers.push(...findWorkers(full));
    } else if (entry.isFile() && entry.name.endsWith('.worker.js') && path.resolve(dir) !== absOutDir) {
      workers.push(full);
    }
  }
  return workers;
}

const workerFiles = findWorkers(monacoEsm);
console.log(`Bundling ${workerFiles.length} worker(s) into ${outDir}`);

for (const workerFile of workerFiles) {
  const name = path.basename(workerFile, '.js');
  await esbuild.build({
    entryPoints: [workerFile],
    outdir: outDir,
    entryNames: name,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    external: ['dompurify'],
    allowOverwrite: true,
  }).catch(() => process.exit(1));
}
