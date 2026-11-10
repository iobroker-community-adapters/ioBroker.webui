import { expect } from 'chai';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { ImportmapCreator } from '../../dist/backend/ImportmapCreator.js';

describe('Incremental npm widget registration', () => {
    it('skips previously registered manifests and preserves already observed libraries', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'webui-packages-'));
        try {
            const manifest = { schemaVersion: '1.0.0', modules: [{ path: 'index.js', declarations: [{ name: 'Widget', tagName: 'test-widget' }], exports: [{ kind: 'custom-element-definition', name: 'test-widget', declaration: { name: 'Widget' } }] }] };
            await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ dependencies: { 'test-widget': '1', 'test-legacy': '1' } }));
            for (const name of ['test-widget', 'test-legacy']) {
                const root = path.join(dir, 'node_modules', name); await fs.mkdir(root, { recursive: true });
                await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name, main: 'index.js' }));
                if (name === 'test-widget') await fs.writeFile(path.join(root, 'custom-elements.json'), JSON.stringify(manifest));
            }
            const creator = new ImportmapCreator({ log: { warn: () => {}, error: error => { throw new Error(error); } } }, dir, '/widgets/node_modules');
            await creator.parsePackages();
            const source = await fs.readFile(path.join(dir, 'configWidgets.js'), 'utf8');
            const calls = [];
            const context = { container: { register: (...args) => calls.push(args) },
                WebcomponentManifestElementsService: class {}, WebcomponentManifestEventsService: class {}, WebcomponentManifestPropertiesService: class {} };
            const body = source.replace(/^import[^\n]*\n/, '').replace('export function', 'function');
            vm.runInNewContext(body + '\nregisterNpmWidgets(container, []); registerNpmWidgets(container, ["test-widget"]);', context);
            expect(calls.map(call => call[0])).to.deep.equal(['elementsService', 'eventsService', 'propertyService']);
            const loader = await fs.readFile(path.join(dir, 'importWidgetFiles.js'), 'utf8');
            expect(loader).to.contain("if (!observer.getElements().has('test-legacy'))");
        } finally { await fs.rm(dir, { recursive: true, force: true }); }
    });
});
