import { expect } from 'chai';
import names from '../../dist/frontend/npm/usable-packages.json' with { type: 'json' };
import { allowedPackageName, describePackage, findPackages, packageCatalog } from '../../dist/frontend/npm/PackageCatalog.js';

describe('AI package catalog', () => {
    it('documents every suggested package exactly once with repository sources', () => {
        expect(packageCatalog.map(p => p.name).sort()).to.deep.equal([...names].sort());
        for (const entry of packageCatalog) {
            expect(entry.description.length).to.be.greaterThan(30);
            expect(entry.sources.length).to.be.greaterThan(0);
            expect(entry.repository).to.match(/^https:\/\/github.com\//);
            expect(new Set(entry.components.map(c => c.tag)).size).to.equal(entry.components.length);
        }
        expect(names).not.to.include('@vanillawc/wc-json');
    });
    it('finds capabilities without requiring a known package name', () => {
        expect(findPackages('gauge').map(p => p.name)).to.include('@node-projects/gauge.webcomponent');
        expect(findPackages('thermostat').map(p => p.name)).to.include('@node-projects/luma-elements');
        expect(findPackages('not-a-real-capability')).to.deep.equal([]);
    });
    it('exposes manifest-backed component APIs on demand and retains unpublished Luma', () => {
        const entry = describePackage('@node-projects/input-knob', 'node-projects-input-knob');
        expect(entry.components[0].properties.map(p => p.name)).to.include('value');
        expect(describePackage('@node-projects/luma-elements').components.map(c => c.tag)).to.include('luma-thermostat');
        expect(() => describePackage('@node-projects/input-knob', 'invented-tag')).to.throw('Unknown component');
    });
    it('rejects removed/unlisted packages, versions, URLs and command fragments', () => {
        for (const name of ['@vanillawc/wc-json', 'react', '--ignore-scripts', '@node-projects/input-knob@latest', 'https://example.com/pkg.tgz', 'vanilla-colorful; id', null]) {
            expect(() => allowedPackageName(name)).to.throw('exact package name');
        }
        expect(allowedPackageName('@node-projects/luma-elements')).to.equal('@node-projects/luma-elements');
    });
});
