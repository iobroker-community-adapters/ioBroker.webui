// Opt-in controls for inspecting real editor components without a live backend.
// Never loaded by the production page or copied into www.
const { BindingTarget, BoxShadowEditorWindow, TextShadowEditorWindow, GradientEditorWindow, BorderRadiusEditorWindow } = await importShim('@node-projects/web-component-designer');
const { BindingsEditorHistoric, ParameterEditor, SimpleScriptEditor } = await importShim('@node-projects/web-component-designer-visualization-addons');
const { IobrokerWebuiBindingsEditor } = await importShim('./dist/frontend/config/IobrokerWebuiBindingsEditor.js');
const controls = document.querySelector('details > div');
function review(label, create, width = 600, height = 500) {
    const button = document.createElement('button'); button.textContent = label;
    button.onclick = async () => {
        const shell = window.appShell;
        const editor = shell.getActiveScreenEditor() ?? shell.getScreenEditors()[0] ?? await shell.openScreenEditor('theme-review', 'screen', '<h1>Theme review</h1>', '', '', {});
        const component = await create(shell, editor.documentContainer.instanceServiceContainer);
        await shell.openConfirmation(component, { title: label, width, height });
    };
    controls.append(button);
}
review('Review bindings', (shell, instance) => new IobrokerWebuiBindingsEditor({ name: 'textContent' }, null, BindingTarget.property, shell.serviceContainer, instance, shell));
review('Review history', () => new BindingsEditorHistoric(), 380, 500);
review('Review parameters', () => { const editor = new ParameterEditor(); editor.setParametersObject({ label: 'Text', count: 0, enabled: false }); return editor; });
review('Review signals', (shell, instance) => { const browser = shell.createBindableObjectBrowser(); browser.initialize(shell.serviceContainer, instance, 'property'); return browser; });

review('Review script', async (shell, instance) => {
    const editor = new SimpleScriptEditor();
    editor.serviceContainer = shell.serviceContainer; editor.instanceServiceContainer = instance;
    editor.visualizationShell = shell;
    const { iobrokerHandler } = await importShim('./dist/frontend/common/IobrokerHandler.js');
    editor.visualizationHandler = iobrokerHandler;
    editor.scriptCommandsTypeInfo = await (await fetch('./dist/frontend/generated/ScriptCommands.json')).json();
    editor.propertiesTypeInfo = await (await fetch('./dist/frontend/generated/Properties.json')).json();
    editor.loadScript({ commands: [] });
    return editor;
});

for (const [label, Component] of [['box shadow', BoxShadowEditorWindow], ['text shadow', TextShadowEditorWindow], ['gradient', GradientEditorWindow], ['border radius', BorderRadiusEditorWindow]]) {
    const button = document.createElement('button'); button.textContent = 'Review ' + label;
    button.onclick = () => Component.showWindow(new Component()); controls.append(button);
}

review('Review command details', async (shell, instance) => {
    const editor = new SimpleScriptEditor();
    editor.serviceContainer = shell.serviceContainer; editor.instanceServiceContainer = instance; editor.visualizationShell = shell;
    const { iobrokerHandler } = await importShim('./dist/frontend/common/IobrokerHandler.js');
    editor.visualizationHandler = iobrokerHandler;
    editor.scriptCommandsTypeInfo = await (await fetch('./dist/frontend/generated/ScriptCommands.json')).json();
    editor.propertiesTypeInfo = await (await fetch('./dist/frontend/generated/Properties.json')).json();
    editor.loadScript({ commands: [{type:'SetSignalValue',signal:'fixture.0.temperature',target:'signal',value:22},{type:'Delay',value:500}] });
    return editor;
}, 900, 650);
