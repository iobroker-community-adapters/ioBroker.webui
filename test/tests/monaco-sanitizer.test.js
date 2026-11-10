import { expect } from 'chai';
import { readFile, readdir } from 'node:fs/promises';

const packageRoot = new URL('../../www/node_modules/@node-projects/monaco-editor-esm/', import.meta.url);
describe('packaged Monaco sanitizer', () => {
    it('uses the rebuilt browser entry and current DOMPurify in both production and debug source', async () => {
        const map = await readFile(new URL('../../www/dist/importmaps/importmap-config.js', import.meta.url), 'utf8');
        expect(map).to.contain('esm/vs/editor/webui/editor.main.js');
        const files = await readdir(new URL('esm/vs/editor/webui/', packageRoot));
        const bundle = (await Promise.all(files.filter(x => x.endsWith('.js')).map(file => readFile(new URL('esm/vs/editor/webui/' + file, packageRoot), 'utf8')))).join('\n');
        expect(bundle).to.contain('version="3.4.17"');
        expect(bundle).not.to.contain('version="3.4.8"');
        const source = await readFile(new URL('esm/vs/base/browser/dompurify/dompurify.js', packageRoot), 'utf8');
        expect(source).to.match(/DOMPurify\.version\s*=\s*["']3\.4\.17["']/);
    });
});
