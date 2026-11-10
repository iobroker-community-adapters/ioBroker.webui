// Opt-in cross-document regression checks using the real dock browser-window path.
const controls = document.querySelector('details > div');
const report = document.createElement('pre'); report.id = 'detached-window-report'; report.style.cssText='max-height:45vh;max-width:90vw;overflow:auto;font-size:11px'; controls.append(report);
function checkButton(label, test) {
    const button = document.createElement('button'); button.textContent = label; controls.append(button);
    button.onclick = async () => {
        const checks = [];
        const assert = (condition, label) => { if(!condition) throw new Error(label); checks.push(label); };
        try { await test(assert); report.textContent='PASS\n'+checks.join('\n'); }
        catch(error) {report.textContent='FAIL\n'+checks.join('\n')+'\n'+error.stack;}
    };
}
const tick = () => new Promise(resolve => setTimeout(resolve,100));
function capture(shell) {
    const manager = shell.shadowRoot.querySelector('#dock').dockManager;
    let window, panel;
    const listener = {onNewWindow(_manager,p,w){window=w;panel=p;manager.removeLayoutListener(listener);}};
    manager.addLayoutListener(listener);
    return {manager,get window(){return window;},get panel(){return panel;}};
}
checkButton('Verify detached screen', async assert => {
    const shell=window.appShell;
    const editor=await shell.openScreenEditor('detached-review','screen','<h1 id="heading">Detached design</h1>',':host{display:block;padding:20px}', 'export const keep=1;', {width:'640px'}, {});
    const state=capture(shell), original=await editor.getSnapshot();
    const panel=state.manager.getPanels().find(panel=>panel.resolvedElementContent===editor);
    panel.undockToBrowserDialog(); await tick();
    const win=state.window;
    assert(win && editor.ownerDocument===win.document && editor.isConnected,'Screen remains connected in a separate browser document');
    assert(editor.documentContainer.instanceServiceContainer.designerCanvas,'Designer services survive detachment');
    assert(shell.getScreenEditors().includes(editor),'Detached screen stays in workspace discovery');
    assert(shell.getAiWindows().some(item=>item.document?.name==='detached-review' && item.detached),'AI can discover detached screens');
    const same=await shell.openScreenEditor('detached-review','screen','wrong','','',{},{});
    assert(same===editor && shell.getScreenEditors().filter(item=>item.name==='detached-review').length===1,'Opening an already detached screen focuses it without duplication');
    const canvas=editor.documentContainer.designerView.designerCanvas;
    const heading=canvas.rootDesignItem.element.shadowRoot.querySelector('#heading'), rect=heading.getBoundingClientRect();
    for(const type of ['pointerdown','pointerup']) canvas.clickOverlay.dispatchEvent(new win.PointerEvent(type,{bubbles:true,pointerId:1,isPrimary:true,button:0,clientX:rect.x+10,clientY:rect.y+10}));
    await tick();
    assert(canvas.instanceServiceContainer.selectionService.selectedElements.some(item=>item.id==='heading'),'Pointer events select authored content in the detached canvas');
    const {dragDropFormatNameElementDefinition}=await importShim('@node-projects/web-component-designer');
    const transfer=new DataTransfer(); transfer.setData(dragDropFormatNameElementDefinition,JSON.stringify({tag:'button',defaultContent:'Dropped across windows',defaultWidth:'160px',defaultHeight:'40px'}));
    const target=canvas.rootDesignItem.element.getBoundingClientRect();
    const event=new win.DragEvent('drop',{bubbles:true,dataTransfer:transfer,clientX:target.x+150,clientY:target.y+150});
    await shell.serviceContainer.dragDropService.drop(canvas,event); await tick();
    assert((await editor.getSnapshot()).html.includes('Dropped across windows'),'Native palette drop inserts an authored element across windows');
    if(!customElements.get('fixture-detached-widget')) customElements.define('fixture-detached-widget',class extends HTMLElement {constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<b>Widget ready</b>';}});
    transfer.setData(dragDropFormatNameElementDefinition,JSON.stringify({tag:'fixture-detached-widget',defaultWidth:'100px',defaultHeight:'40px'}));
    await shell.serviceContainer.dragDropService.drop(canvas,event); await tick();
    assert(canvas.rootDesignItem.element.shadowRoot.querySelector('fixture-detached-widget')?.shadowRoot?.textContent.includes('Widget ready'),'Dropped custom components use the live widget registry');
    const before=await editor.getSnapshot();
    await editor.applyAiSnapshot({...before,html:before.html+'<p>AI detached edit</p>',style:':host{display:block;color:blue}',script:'export const changed=2;',settings:{width:'700px'}});
    assert((await editor.getSnapshot()).html.includes('AI detached edit'),'AI applies to a detached screen');
    canvas.instanceServiceContainer.undoService.undo();
    assert(JSON.stringify(await editor.getSnapshot())===JSON.stringify(before),'Detached Undo restores the complete pre-AI snapshot');
    win.document.querySelector('button:last-of-type').click(); await tick();
    assert(editor.ownerDocument===document && editor.isConnected && shell.getScreenEditors().includes(editor),'Return to main window preserves the live unsaved document');
    assert((await editor.getSnapshot()).script===original.script,'Unsaved source survives the round trip');
    assert(state.manager.getPanels().find(item=>item.resolvedElementContent===editor)?.title===panel.title,'Screen title survives the round trip');
});

checkButton('Verify detached AI', async assert => {
    const shell=window.appShell;
    shell.showAiAssistant(); await tick();
    const state=capture(shell), panel=state.manager.getPanels().find(panel=>panel.resolvedElementContent.id==='aiDock');
    panel.undockToBrowserDialog(); await tick();
    const win=state.window, ai=panel.resolvedElementContent.querySelector('iobroker-webui-ai-panel'), root=ai.shadowRoot;
    assert(ai.isConnected && ai.ownerDocument===win.document,'AI remains connected in its browser window');
    const prompt=root.querySelector('#prompt'); prompt.value='Verify a detached AI conversation'; prompt.dispatchEvent(new win.Event('input',{bubbles:true}));
    root.querySelector('#send').click();
    const deadline=Date.now()+10000;
    while(!root.querySelector('article[data-role="assistant"]') && Date.now()<deadline) await tick();
    assert(root.querySelector('article[data-role="assistant"]')?.textContent.includes('proposed screen'),'Detached AI sends requests, runs tools and receives an answer');
    assert(root.querySelector('.proposal button') && root.querySelector('time'),'Detached AI renders proposal actions and message metadata');
    root.querySelector('#back').click();
    const chat=root.querySelector('#sessions button'); chat.dispatchEvent(new win.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:20,clientY:80}));
    assert(!root.querySelector('#menu').hidden,'Chat context menu opens in the detached document');
    win.document.body.dispatchEvent(new win.Event('pointerdown',{bubbles:true}));
    assert(root.querySelector('#menu').hidden,'Outside clicks dismiss the detached chat context menu');
    win.close(); await tick();
    assert(ai.isConnected && ai.ownerDocument===document,'Closing the AI browser window returns the live chat to the main window');
    shell.showAiAssistant(); await tick();
    assert(ai.shadowRoot.querySelector('#sessions button')?.textContent.includes('detached AI'),'Chat history survives the browser-window round trip');
    root.querySelector('#sessions button').click();
    prompt.value='Continue while the chat is detached'; prompt.dispatchEvent(new Event('input',{bubbles:true})); root.querySelector('#send').click();
    const moving=capture(shell), livePanel=moving.manager.getPanels().find(panel=>panel.resolvedElementContent.querySelector('iobroker-webui-ai-panel')===ai);
    livePanel.undockToBrowserDialog();
    const nextDeadline=Date.now()+10000;
    while(root.querySelectorAll('article[data-role="assistant"]').length<2 && Date.now()<nextDeadline) await tick();
    assert(root.querySelectorAll('article[data-role="assistant"]').length===2,'An in-flight AI turn continues through detachment');
    moving.window.close(); await tick();
});

checkButton('Verify detached tool docks', async assert => {
    const shell=window.appShell;
    const editor=shell.getScreenEditors()[0] ?? await shell.openScreenEditor('tool-review','screen','<button id="tool-button">Tool review</button>',':host{display:block}', '',{},{});
    editor.activated();
    for(const id of ['treeUpper','treeViewExtended','attributeDock','settingsDock','refactorDock','eventsDock','propertiesDock','styleDock','javascriptDock']) {
        const state=capture(shell), panel=state.manager.getPanels().find(panel=>panel.resolvedElementContent.id===id || panel.resolvedElementContent.querySelector('#'+id));
        assert(panel,'Found dock '+id);
        const element=panel.resolvedElementContent;
        const parentType=state.manager.getNodeByElement(element)?.parent?.container.containerType;
        panel.undockToBrowserDialog(); await tick();
        const win=state.window;
        assert(element.isConnected && element.ownerDocument===win.document && element.getBoundingClientRect().width>0,'Dock remains live after detaching: '+id);
        assert(shell.getAiWindows().some(item=>item.detached && item.tag===element.localName),'Detached dock remains discoverable: '+id);
        if(id==='treeUpper') {
            let creations=0;
            if(!customElements.get('fixture-protected-drag')) customElements.define('fixture-protected-drag',class extends HTMLElement {constructor(){super();creations++;}});
            const {dragDropFormatNameElementDefinition}=await importShim('@node-projects/web-component-designer');
            const transfer=new DataTransfer();
            win.dispatchEvent(new win.DragEvent('dragstart',{dataTransfer:transfer}));
            transfer.setData(dragDropFormatNameElementDefinition,JSON.stringify({tag:'fixture-protected-drag',defaultWidth:'80px',defaultHeight:'30px'}));
            const getData=transfer.getData.bind(transfer); transfer.getData=()=>'';
            const canvas=editor.documentContainer.designerView.designerCanvas, bounds=canvas.rootDesignItem.element.getBoundingClientRect();
            await shell.serviceContainer.dragDropService.dragOver(canvas,new DragEvent('dragover',{dataTransfer:transfer,clientX:bounds.x+10,clientY:bounds.y+10}));
            assert(creations>0,'A detached palette shares drag data during protected drag-over');
            transfer.getData=getData; shell.serviceContainer.dragDropService.dragLeave(canvas,new DragEvent('dragleave',{dataTransfer:transfer}));
            win.dispatchEvent(new win.DragEvent('dragend',{dataTransfer:transfer}));
        }
        if(id==='attributeDock') {
            const item=[...editor.documentContainer.editingDocument.rootDesignItem.children()].find(item=>item.node.nodeType===1);
            editor.documentContainer.instanceServiceContainer.selectionService.setSelectedElements([item]); await tick();
            const input=element.querySelector('node-projects-web-component-designer-property-grid-with-header').shadowRoot.querySelector('#id');
            input.value='detached-property-edit'; input.dispatchEvent(new win.Event('input',{bubbles:true})); input.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
            assert(item.id==='detached-property-edit','Detached property grid edits the selected element');
        }
        if(id==='styleDock' || id==='javascriptDock') {
            const code=element.querySelector('iobroker-webui-monaco-editor'), model=code.model;
            const before=model.getValue(), after=id==='styleDock' ? ':host { color: green; }' : 'export const fromDetachedEditor = true;';
            model.pushStackElement(); model.pushEditOperations([],[{range:model.getFullModelRange(),text:after}],()=>null); model.pushStackElement();
            const buttons=[...win.document.querySelectorAll('button')];
            buttons.find(button=>button.textContent==='Undo').click();
            assert(model.getValue()===before,'Detached Monaco Undo works: '+id);
            buttons.find(button=>button.textContent==='Redo').click();
            assert(model.getValue()===after && code.value===after,'Detached Monaco Redo preserves the shared model: '+id);
            buttons.find(button=>button.textContent==='Save').click(); await tick();
            const {fixtureWrites}=await import('./fixture-connection.js');
            assert(fixtureWrites.some(write=>write.path.endsWith('.screen') && write.data[id==='styleDock'?'style':'script']===after),'Detached code Save saves its owning screen: '+id);
        }
        [...win.document.querySelectorAll('button')].find(button=>button.textContent==='Return to main window').click(); await tick();
        assert(element.isConnected && element.ownerDocument===document,'Dock returns without being disposed: '+id);
        assert(state.manager.getPanels().find(item=>item.resolvedElementContent===element)?.title===panel.title,'Dock title survives the round trip: '+id);
        assert(state.manager.getNodeByElement(element)?.parent?.container.containerType===parentType,'Original tab/split grouping is restored: '+id);
    }
});

checkButton('Verify detached global editors', async assert => {
    const shell=window.appShell;
    await shell.openGlobalStyleEditor(':host { color: teal; }','Global CSS fixture','globalStyle'); await tick();
    await shell.openGlobalScriptEditor('export const fixtureValue = 1;'); await tick();
    await shell.openGlobalConfigEditor(); await tick();
    for(const id of ['global_styleEditor','global_scriptEditor','global_ConfigEditor']) {
        const state=capture(shell), panel=state.manager.getPanels().find(panel=>panel.resolvedElementContent.id===id), element=panel?.resolvedElementContent;
        assert(element,'Global editor opens: '+id);
        panel.undockToBrowserDialog(); await tick();
        const win=state.window;
        assert(element.isConnected && element.ownerDocument===win.document,'Global editor remains live when detached: '+id);
        if(element.model) {
            const before=element.model.getValue(), after=id==='global_styleEditor' ? ':host { color: purple; }' : 'export const fixtureValue = 2;';
            element.model.pushStackElement(); element.model.pushEditOperations([],[{range:element.model.getFullModelRange(),text:after}],()=>null); element.model.pushStackElement();
            const buttons=[...win.document.querySelectorAll('button')];
            buttons.find(button=>button.textContent==='Undo').click(); assert(element.model.getValue()===before,'Global editor Undo works: '+id);
            buttons.find(button=>button.textContent==='Redo').click(); assert(element.model.getValue()===after,'Global editor Redo works: '+id);
        }
        [...win.document.querySelectorAll('button')].find(button=>button.textContent==='Return to main window').click(); await tick();
        assert(element.isConnected && element.ownerDocument===document,'Global editor returns without losing its model: '+id);
        assert(state.manager.getPanels().find(item=>item.resolvedElementContent===element)?.title===panel.title,'Global editor title survives the round trip: '+id);
    }
});
