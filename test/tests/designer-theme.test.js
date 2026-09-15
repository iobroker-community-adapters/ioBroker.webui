import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../../assets/designer-theme.js', import.meta.url), 'utf8');

function loadTheme({ stored = null, dark = false, blocked = false } = {}) {
    const root = { dataset: {} };
    const attributes = {};
    const events = {};
    const writes = [];
    let toggleReady = false;
    let changes = 0;
    const toggle = {
        setAttribute: (name, value) => { attributes[name] = value; },
        addEventListener: (name, callback) => { events[name] = callback; }
    };
    const system = { matches: dark, addEventListener: (_, callback) => { events.system = callback; } };
    vm.runInNewContext(script, {
        document: {
            documentElement: root,
            getElementById: () => toggleReady ? toggle : null,
            addEventListener: (_, callback) => { events.ready = callback; }
        },
        window: { matchMedia: () => system, dispatchEvent: () => { changes++; } },
        localStorage: {
            getItem: () => { if (blocked) throw new Error('Storage blocked'); return stored; },
            setItem: (key, value) => { if (blocked) throw new Error('Storage blocked'); writes.push([key, value]); }
        },
        Event: class { }
    });
    return { root, attributes, toggle, system, events, writes, changes: () => changes,
        ready: () => { toggleReady = true; events.ready(); } };
}

describe('designer theme preference', () => {
    it('applies a saved preference before the toolbar exists, overriding the system', () => {
        const theme = loadTheme({ stored: 'light', dark: true });
        expect(theme.root.dataset.theme).to.equal('light');
        theme.ready();
        expect(theme.attributes['aria-checked']).to.equal('false');
    });

    it('follows the system until the user chooses a mode, then persists the choice', () => {
        const theme = loadTheme({ stored: 'invalid' });
        theme.ready();
        theme.system.matches = true;
        theme.events.system();
        expect(theme.root.dataset.theme).to.equal('dark');
        expect(theme.attributes['aria-checked']).to.equal('true');
        theme.events.click();
        expect(theme.root.dataset.theme).to.equal('light');
        expect(theme.toggle.title).to.equal('Switch to dark mode');
        expect(theme.writes).to.deep.equal([['webui.designer.theme', 'light']]);
        theme.events.system();
        expect(theme.root.dataset.theme).to.equal('light');
    });

    it('switches both ways and notifies editors even when browser storage is blocked', () => {
        const theme = loadTheme({ blocked: true, dark: true });
        theme.ready();
        theme.events.click();
        expect(theme.root.dataset.theme).to.equal('light');
        theme.events.click();
        expect(theme.root.dataset.theme).to.equal('dark');
        expect(theme.attributes['aria-checked']).to.equal('true');
        expect(theme.toggle.title).to.equal('Switch to light mode');
        expect(theme.changes()).to.equal(4);
    });
});
