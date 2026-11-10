// Explicit opt-in browser regression checks; never loaded by the production page.
const controls = document.querySelector('details > div');
const button = document.createElement('button'); button.textContent = 'Verify AI context and undo'; controls.append(button);
const report = document.createElement('pre'); report.id = 'ai-context-report'; controls.append(report);
button.onclick = async () => {
    const checks = [];
    const assert = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };
    const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    try {
        const { AiWorkspaceAdapter } = await importShim('./dist/frontend/ai/AiWorkspaceAdapter.js');
        const { AiToolContext } = await importShim('./dist/frontend/ai/AiTools.js');
        const { assetPreview } = await importShim('./dist/frontend/ai/AiAssetPreview.js');
        const { userMessage } = await importShim('./dist/frontend/ai/AiAttachments.js');
        const shell = window.appShell;
        const editor = await shell.openScreenEditor('context-review', 'screen', '<section><div id="temperature">Heating</div><button id="aa">Door</button></section>', ':host {display:block}', 'export const initial = 1;', {width:'640px'}, {enabled:{type:'boolean',default:false}});
        const original = await editor.getSnapshot();
        const document = editor.documentContainer.editingDocument;
        const undo = document.instanceServiceContainer.undoService;
        await document.loadHtml('<section><div id="temperature">Manual heating</div><button id="aa">Door</button></section>', false);
        const before = await editor.getSnapshot(), count = undo.undoCount;
        const proposed = structuredClone(before);
        proposed.html = '<section><div id="temperature">AI heating</div><button id="aa">Door</button></section>';
        proposed.style = ':host {display:block;color:red}'; proposed.script = 'export const changed = 2;';
        proposed.settings = {width:'800px',height:'600px'}; proposed.properties = {value:{type:'number',default:0}};
        await editor.applyAiSnapshot(proposed);
        const applied = await editor.getSnapshot();
        assert(undo.undoCount === count + 1, 'AI Apply adds exactly one document undo entry (' + count + ' → ' + undo.undoCount + ': ' + [...undo.getUndoEntryNames()].join(', ') + ')' );
        assert(applied.html.includes('AI heating') && applied.style === proposed.style && applied.script === proposed.script && equal(applied.settings, proposed.settings) && equal(applied.properties, proposed.properties), 'Apply updates HTML, CSS, JavaScript, settings and typed properties');
        undo.undo();
        assert(equal(await editor.getSnapshot(), before), 'Undo restores all five document fields');
        undo.undo();
        assert(equal(await editor.getSnapshot(), original), 'Earlier manual undo history survives AI Apply');
        undo.redo(); undo.redo();
        assert(equal(await editor.getSnapshot(), applied), 'Redo restores the complete AI proposal');
        await new Promise(resolve => setTimeout(resolve, 350));
        assert(undo.undoCount === count + 1, 'Delayed CSS synchronization adds no spurious undo entry');
        const selected = [...[...document.rootDesignItem.children()][0].children()][0];
        document.instanceServiceContainer.selectionService.setSelectedElements([selected]);
        const workspace = new AiWorkspaceAdapter(shell), tools = new AiToolContext(workspace, [], 'custom');
        const context = JSON.parse(await tools.run('get_editor_context', {}));
        assert(context.document.name === 'context-review' && equal(context.selection[0].path, [0,0]), 'Context exposes the selected authored element path');
        await tools.run('read_document', {type:'screen', name:'context-review'});
        await tools.run('stage_element_attributes', {type:'screen', name:'context-review', path:[0,0], attributes:{'bind-css:background-color':JSON.stringify({signal:'fixture.0.temperature',converter:{'<=0':'blue','>=20':'red'}})}});
        assert(tools.proposals[0].data.html.includes('bind-css:background-color') && tools.proposals[0].data.script === applied.script, 'Focused binding proposal preserves separate JavaScript');
        const preview = await assetPreview({base64:btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="red"/></svg>'), mimeType:'image/svg+xml',path:'test-icon.svg'});
        const message = userMessage('Requested preview', [preview], 'custom');
        assert(preview.content.startsWith('data:image/png;base64,') && message.content[1].type === 'image_url', 'SVG icon rasterizes into a bounded multimodal image preview');
        const helper = shell.bindingsHelper;
        const converter = helper.compileConverter({'<=0':'blue','>=20':'red','0-20':'purple'}, []);
        assert(helper.applyCompiledConverter(-5, converter, [], undefined, {}, 'gray') === 'blue' && helper.applyCompiledConverter(25, converter, [], undefined, {}, 'gray') === 'red', 'Installed binding converter maps cold to blue and warm to red');
        const parser = document.serviceContainer.htmlParserService, parse = parser.parse;
        const stable = await editor.getSnapshot(), stableCount = undo.undoCount;
        try {
            parser.parse = async () => { throw new Error('Expected parser failure'); };
            try { await editor.applyAiSnapshot({...stable, html:'invalid test'}); throw new Error('Failure was swallowed'); }
            catch (error) { if (error.message !== 'Expected parser failure') throw error; }
        } finally { parser.parse = parse; }
        assert(undo.undoCount === stableCount && equal(await editor.getSnapshot(), stable), 'Rejected HTML leaves the document and undo history unchanged');
        await workspace.applyProposal({type:'screen',name:'new-ai-review',before:null,data:{html:'<h2>New AI screen</h2>',style:':host {color:blue}',script:'export const value=1;',settings:{width:'500px'},properties:{enabled:{type:'boolean',default:false}}},status:'pending'});
        const newEditor = shell.getActiveScreenEditor();
        assert((await newEditor.getSnapshot()).html.includes('New AI screen'), 'New-screen proposal applies through the workspace');
        newEditor.documentContainer.instanceServiceContainer.undoService.undo();
        const empty = await newEditor.getSnapshot();
        assert(empty.html === '' && empty.style === '' && empty.script === '' && equal(empty.settings,{}) && equal(empty.properties,{}), 'New-screen Undo restores its empty unsaved baseline');
        report.textContent = 'PASS\n' + checks.join('\n');
    } catch (error) { report.textContent = 'FAIL\n' + checks.join('\n') + '\n' + error.stack; }
};
