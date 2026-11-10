import { build } from 'esbuild';
import { copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const monaco = path.join(root, 'node_modules/@node-projects/monaco-editor-esm');
// This fork embeds DOMPurify instead of declaring it as an npm dependency.
// Patching its readable source also covers the debug import-map alias.
await copyFile(path.join(root, 'node_modules/dompurify/dist/purify.es.mjs'), path.join(monaco, 'esm/vs/base/browser/dompurify/dompurify.js'));
const outdir = path.join(monaco, 'esm/vs/editor/webui');
await rm(outdir, { recursive: true, force: true });
await build({
    entryPoints: [path.join(monaco, 'esm/vs/editor/editor.main.js')],
    outdir,
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    loader: { '.ttf': 'file' },
    logLevel: 'warning',
});
