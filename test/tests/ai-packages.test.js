import { expect } from 'chai';
import { AiPackageService } from '../../dist/backend/AiPackageService.js';
import { loadInstalledPackages } from '../../dist/frontend/npm/LoadInstalledPackages.js';
import { AiToolContext } from '../../dist/frontend/ai/AiTools.js';

const name = '@node-projects/input-knob';
function fixture() {
    const packages = {}, calls = [];
    const operations = {
        busy: () => false, installed: async () => ({ ...packages }),
        status: async value => { calls.push(value); },
        install: async value => { calls.push(['install', value]); packages[value] = '^1.1.0'; return 0; },
        publish: async () => { calls.push('publish'); }
    };
    return { operations, calls, packages, service: new AiPackageService(operations) };
}
describe('AI package operations', () => {
    it('waits for install and publish before reporting completion', async () => {
        const { service, calls } = fixture();
        expect(await service.add(name)).to.deep.equal({ name, status: 'installed', version: '^1.1.0' });
        expect(calls.indexOf('publish')).to.be.greaterThan(calls.findIndex(c => Array.isArray(c)));
        expect(calls.at(-1)).to.equal('idle'); expect(service.running).to.equal(false);
    });
    it('does not reinstall existing packages and republishes to recover failed loader generation', async () => {
        const { service, calls, packages } = fixture(); packages[name] = '^1.1.0';
        expect((await service.add(name)).status).to.equal('already-installed');
        expect(calls.some(c => Array.isArray(c))).to.equal(false); expect(calls).to.include('publish');
    });
    it('rejects unlisted input and concurrent npm operations before installation', async () => {
        const { service, operations, calls } = fixture();
        await expect(service.add(name + '@latest')).to.be.rejectedWith('exact package name');
        operations.busy = () => true;
        await expect(service.add(name)).to.be.rejectedWith('Another npm');
        expect(calls).to.deep.equal([]);
    });
    it('holds the AI lock throughout publication and releases it on failure', async () => {
        const { service, operations } = fixture(); let finish;
        operations.publish = () => new Promise((_, reject) => { finish = reject; });
        const first = service.add(name);
        while (!finish) await new Promise(resolve => setImmediate(resolve));
        await expect(service.add(name)).to.be.rejectedWith('Another npm');
        const failed = expect(first).to.be.rejectedWith('upload failed'); finish(new Error('upload failed')); await failed;
        expect(service.running).to.equal(false);
    });
    it('does not publish or report success after npm failure', async () => {
        const { service, operations, calls } = fixture(); operations.install = async () => 1;
        await expect(service.add(name)).to.be.rejectedWith('exit 1');
        expect(calls).not.to.include('publish'); expect(calls.at(-1)).to.equal('idle');
    });
    it('loads the new map before registration/imports and propagates activation failures', async () => {
        const calls = [], module = { registerNpmWidgets: () => {} };
        await loadInstalledPackages('/widgets', { widgets: config => { expect(config).to.equal(module); calls.push('register'); }, addons: async () => { calls.push('addons'); } }, async url => { calls.push(url.split('?')[0]); return module; });
        expect(calls).to.deep.equal(['/widgets/importmap.js', '/widgets/configWidgets.js', 'register', '/widgets/importWidgetFiles.js', '/widgets/designerAddons.js', 'addons']);
        await expect(loadInstalledPackages('/widgets/', { widgets: () => {}, addons: async () => {} }, async () => { throw new Error('load failed'); })).to.be.rejectedWith('load failed');
    });
    it('exposes discovery and install tools with server-side validation as well as client validation', async () => {
        const installed = { [name]: '^1.1.0' }; let requested;
        const context = new AiToolContext({ installedPackages: async () => installed, addPackage: async value => { requested = value; return { status: 'installed' }; } }, []);
        const found = JSON.parse(await context.run('list_packages', { query: 'knob' }));
        expect(found.installed).to.deep.equal(installed); expect(found.packages.map(p => p.name)).to.include(name);
        expect(JSON.parse(await context.run('describe_package', { name })).description).to.contain('rotary');
        await expect(context.run('add_package', { name: 'react' })).to.be.rejectedWith('exact package name');
        expect(requested).to.equal(undefined); await context.run('add_package', { name }); expect(requested).to.equal(name);
    });
});
