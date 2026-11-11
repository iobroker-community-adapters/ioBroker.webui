import { expect } from 'chai';
import {
    describeSettings,
    evaluateCondition,
    findComponent,
    getDefaultAttributes,
    getElementDefinition,
    isInsideDesignerCanvas,
    readSettings,
    sameSettings,
    settingAttributeName,
    webComponentHostTag,
} from '../../dist/frontend/webcomponents/WebComponentHost.js';

const manifest = {
    manifestVersion: 1,
    tag: 'iob-state-tile',
    name: { en: 'State tile', de: 'Zustandskachel' },
    description: { en: 'Shows a state', de: 'Zeigt einen Datenpunkt' },
    icon: 'iob-state-tile.svg',
    module: 'iob-state-tile.js',
    size: { width: 180, height: 110 },
    settings: {
        type: 'panel',
        items: {
            head: { type: 'header', text: 'Values' },
            oid: { type: 'objectId', label: { en: 'State', de: 'Datenpunkt' }, help: 'The state to show' },
            decimals: { type: 'number', label: 'Decimals', min: 0, max: 6, default: 1 },
            toggle: { type: 'checkbox', label: 'Toggle on click', default: true },
            textTrue: { type: 'text', label: 'Text for true', hidden: '!data.toggle' },
            mode: { type: 'select', label: 'Mode', options: [{ value: 'a', label: { en: 'Auto', de: 'Automatisch' } }, { value: 2, label: 'Two' }], disabled: 'data.decimals > 3' },
            instance: { type: 'instance', adapter: 'flow' },
        },
    },
};

const component = {
    url: 'http://host:8082/adapter/demo/webcomponents/iob-state-tile.json',
    moduleUrl: 'http://host:8082/adapter/demo/webcomponents/iob-state-tile.js',
    adapter: 'demo',
    version: '1.0.0',
    manifest,
};

const attributes = values => name => (name in values ? values[name] : null);

describe('ioBroker web component host', () => {
    it('stores every setting as a dash-case attribute', () => {
        expect(settingAttributeName('oid')).to.equal('setting-oid');
        expect(settingAttributeName('textTrue')).to.equal('setting-text-true');
    });

    it('types the settings as the manifest declares them', () => {
        const settings = readSettings(manifest, attributes({
            'setting-oid': 'javascript.0.test',
            'setting-decimals': '2,5',
            'setting-toggle': '',
            'setting-mode': '2',
        }));
        expect(settings).to.deep.equal({ oid: 'javascript.0.test', decimals: 2.5, toggle: true, mode: '2' });
    });

    it('treats a checkbox like a boolean attribute and leaves other missing settings out', () => {
        expect(readSettings(manifest, attributes({}))).to.deep.equal({ toggle: false });
        expect(readSettings(manifest, attributes({ 'setting-toggle': 'false' })).toggle).to.equal(false);
        expect(readSettings(manifest, attributes({ 'setting-toggle': 'true' })).toggle).to.equal(true);
    });

    it('writes the component and the defaults into a new instance', () => {
        expect(getDefaultAttributes(component)).to.deep.equal({
            adapter: 'demo',
            component: 'iob-state-tile',
            'setting-decimals': '1',
            'setting-toggle': '',
        });
        const off = { ...component, manifest: { ...manifest, settings: { type: 'panel', items: { on: { type: 'checkbox', default: false } } } } };
        expect(getDefaultAttributes(off)).to.deep.equal({ adapter: 'demo', component: 'iob-state-tile' });
    });

    it('builds a palette entry in the language of the user', () => {
        const definition = getElementDefinition(component, 'de');
        expect(definition.tag).to.equal(webComponentHostTag);
        expect(definition.name).to.equal('Zustandskachel');
        expect(definition.icon).to.equal('http://host:8082/adapter/demo/webcomponents/iob-state-tile.svg');
        expect(definition.defaultWidth).to.equal('180px');
        expect(definition.defaultHeight).to.equal('110px');
        expect(definition.defaultAttributes.component).to.equal('iob-state-tile');
        expect(definition.description).to.contain('Zeigt einen Datenpunkt').and.contain('setting-oid (objectId)');
    });

    it('describes the settings without decorations and hidden fields', () => {
        const [group] = describeSettings(manifest, 'de', { toggle: false, decimals: 5 });
        expect(group.name).to.equal('settings');
        expect(group.settings.map(s => s.key)).to.deep.equal(['oid', 'decimals', 'toggle', 'mode', 'instance']);
        const oid = group.settings.find(s => s.key === 'oid');
        expect(oid).to.include({ attribute: 'setting-oid', label: 'Datenpunkt', help: 'The state to show', type: 'objectId' });
        const mode = group.settings.find(s => s.key === 'mode');
        expect(mode.options).to.deep.equal([['Automatisch', 'a'], ['Two', '2']]);
        expect(mode.disabled).to.equal(true);
        expect(group.settings.find(s => s.key === 'instance').adapter).to.equal('flow');

        const shown = describeSettings(manifest, 'en', { toggle: true })[0].settings.map(s => s.key);
        expect(shown).to.include('textTrue');
    });

    it('groups the settings of tabs by tab', () => {
        const tabs = {
            ...manifest,
            settings: {
                type: 'tabs',
                items: {
                    main: { type: 'panel', label: 'Main', items: { oid: { type: 'objectId' } } },
                    look: { type: 'panel', label: { en: 'Look', de: 'Aussehen' }, items: { color: { type: 'color' } } },
                },
            },
        };
        expect(describeSettings(tabs, 'de', {}).map(g => g.name)).to.deep.equal(['Main', 'Aussehen']);
    });

    it('takes a broken condition as false', () => {
        expect(evaluateCondition('data.a.b.c', {})).to.equal(false);
        expect(evaluateCondition('data.x === 1', { x: 1 })).to.equal(true);
        expect(evaluateCondition(undefined, {})).to.equal(false);
    });

    it('finds a component by tag and prefers the named adapter', () => {
        const other = { ...component, adapter: 'other' };
        expect(findComponent([other, component], 'demo', 'iob-state-tile')).to.equal(component);
        expect(findComponent([other, component], 'missing', 'iob-state-tile')).to.equal(other);
        expect(findComponent([component], null, null)).to.equal(undefined);
    });

    it('compares settings by value', () => {
        expect(sameSettings({ a: 1, b: 'x' }, { b: 'x', a: 1 })).to.equal(true);
        expect(sameSettings({ a: 1 }, { a: 1, b: undefined })).to.equal(false);
        expect(sameSettings(null, { a: 1 })).to.equal(false);
    });

    it('detects the designer canvas through shadow roots', () => {
        const node = (root) => ({ getRootNode: () => root });
        const canvas = node({ nodeType: 9, defaultView: null });
        canvas.localName = 'node-projects-designer-canvas';
        const screen = node({ nodeType: 11, host: canvas });
        screen.localName = 'iobroker-webui-screen-viewer';
        const element = node({ nodeType: 11, host: screen });
        expect(isInsideDesignerCanvas(element)).to.equal(true);
        expect(isInsideDesignerCanvas(node({ nodeType: 9, defaultView: null }))).to.equal(false);
    });
});
