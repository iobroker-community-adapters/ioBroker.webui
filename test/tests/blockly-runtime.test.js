import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

describe('Blockly runtime bootstrap', () => {
    for (const page of ['runtime.html', 'www/runtime.html']) {
        it(`loads and generates a saved event with the scripts from ${page}`, () => {
            // Use the browser bundles in page order. Importing Blockly's Node entry
            // would load English messages automatically and hide this regression.
            const context = vm.createContext({ console, setTimeout, clearTimeout });
            const pageUrl = new URL(`../../${page}`, import.meta.url);
            const html = readFileSync(pageUrl, 'utf8');
            for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
                if (src.includes('/blockly/')) {
                    vm.runInContext(readFileSync(new URL(src, pageUrl), 'utf8'), context, { filename: src });
                }
            }

            const startEventUrl = new URL('./node_modules/@node-projects/web-component-designer-visualization-addons/dist/blockly/components/StartEvent.js', pageUrl);
            const startEvent = readFileSync(startEventUrl, 'utf8').replace(/^export \{\};?$/mg, '');
            vm.runInContext(startEvent, context);
            context.savedEvent = {
                blocks: {
                    languageVersion: 0,
                    blocks: [{ type: 'start_event', fields: { EVENTVAR: { id: 'saved-event-id' } } }]
                },
                variables: [{ name: 'event', id: 'saved-event-id' }]
            };

            const code = vm.runInContext(`
                const workspace = new Blockly.Workspace();
                try {
                    Blockly.serialization.workspaces.load(savedEvent, workspace);
                    Blockly.JavaScript.workspaceToCode(workspace);
                } finally {
                    workspace.dispose();
                }
            `, context);
            expect(code).to.include('= eventData;');
        });
    }
});
