import { iobrokerHandler } from '../common/IobrokerHandler.js';
import Toastify from 'toastify-js';
//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
iobrokerHandler.init();
const scriptSystem = new IobrokerWebuiScriptSystem(iobrokerHandler);
const bindingsHelper = new BindingsHelper(iobrokerHandler);
import { ValueType } from '@node-projects/web-component-designer';
import { BindableObjectsBrowser } from '@node-projects/web-component-designer-widgets-wunderbaum';
import './ConfigureMonacoEnvironment.js';
import { IobrokerWebuiComponentCatalog } from './IobrokerWebuiComponentCatalog.js';
await CodeViewMonaco.getMonacoLib();
import { PanelContainer, PanelType, SplitterDockContainer } from 'dock-spawn-ts';
import { configureDesigner } from './ConfigureWebcomponentDesigner.js';
const serviceContainer = configureDesigner(bindingsHelper);
import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from '@node-projects/base-custom-webcomponent';
import { CommandHandling } from './CommandHandling.js';
import propertiesTypeInfo from "../generated/Properties.json" with { type: 'json' };
import "../runtime/controls.js";
import "./IobrokerWebuiSolutionExplorer.js";
import "./IobrokerWebuiEventAssignment.js";
import "./IobrokerWebuiControlPropertiesEditor.js";
import { IobrokerWebuiMonacoEditor } from './IobrokerWebuiMonacoEditor.js';
import { IobrokerWebuiScreenEditor } from './IobrokerWebuiScreenEditor.js';
import { IobrokerWebuiConfirmationWrapper } from './IobrokerWebuiConfirmationWrapper.js';
import { getPanelContainerForElement } from './DockHelper.js';
import '../ai/IobrokerWebuiAiPanel.js';
import { AiWorkspaceAdapter } from '../ai/AiWorkspaceAdapter.js';
import { DetachedWindowSupport } from './DetachedWindowSupport.js';
import { fitDialogPosition } from '../helper/DialogPositionHelper.js';
import { IobrokerWebuiPropertyGrid } from './IobrokerWebuiPropertyGrid.js';
import { typeInfoFromJsonSchema } from '@node-projects/propertygrid.webcomponent';
import { IobrokerWebuiScriptSystem } from '../scripting/IobrokerWebuiScriptSystem.js';
import { BindingsHelper } from '@node-projects/web-component-designer-visualization-addons';
import { CodeViewMonaco } from '@node-projects/web-component-designer-codeview-monaco';
export class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
    activeElement;
    mainPage = 'designer';
    serviceContainer;
    _dock;
    _aiDockElement;
    _catalogDock;
    _catalog;
    _dockManager;
    _solutionExplorer;
    styleEditor;
    javascriptEditor;
    controlpropertiesEditor;
    propertyGrid;
    treeViewExtended;
    eventsAssignment;
    settingsEditor;
    refactorView;
    lastContentPanel;
    aiWindowIds = new WeakMap();
    nextAiWindowId = 0;
    npmState;
    scriptSystem;
    bindingsHelper;
    static style = css `
    :host {
      display: block;
      box-sizing: border-box;
      position: relative;

      color: var(--webui-text, #354348);
      background: var(--webui-workspace, #f3f6f6);
    }

    .app-body {
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      height: 100%;
    }

    dock-spawn-ts > div {
      height: 100%;
    }
    `;
    static treeStyle = css `
    div.wunderbaum {
      --wb-node-text-color: var(--webui-text);
      --wb-background-color: var(--webui-surface);
      --wb-border-color: var(--webui-border);
      --wb-focus-border-color: var(--webui-accent);
      --wb-hover-color: var(--webui-hover);
      --wb-hover-border-color: var(--webui-hover);
      --wb-active-color: var(--webui-pressed);
      --wb-active-border-color: var(--webui-accent);
      --wb-active-hover-color: var(--webui-hover);
      --wb-active-hover-border-color: var(--webui-accent);
      --wb-active-color-grayscale: var(--webui-selected);
      --wb-active-border-color-grayscale: var(--webui-border);
      --wb-active-hover-color-grayscale: var(--webui-hover);
      --wb-alternate-row-color: var(--webui-subtle);
      --wb-alternate-row-color-hover: var(--webui-hover);
    }

    .cmd {
      background: var(--webui-surface);
    }

    .cmd img,
    .wb-icon,
    .wb-expander {
      filter: var(--webui-icon-filter, none);
    }

    #input {
      color: var(--webui-text);
      background: var(--webui-surface);
      border: 1px solid var(--webui-input-border);
    }

    /* The upstream outline toolbar uses inline colors. */
    #input + div {
      background: var(--webui-subtle) !important;
      border-color: var(--webui-border) !important;
      fill: var(--webui-text);
    }
  `;
    static template = html `
      <div class="app-body">
        <dock-spawn-ts id="dock" style="width: 100%; height: 100%; position: relative;">
          <div id="treeUpper" title="project" dock-spawn-dock-type="left" dock-spawn-dock-ratio="0.2"
            style="overflow: hidden; width: 100%;">
            <iobroker-webui-solution-explorer id="solutionExplorer"></iobroker-solution-explorer>
          </div>

          <div title="outline" dock-spawn-dock-type="down" dock-spawn-dock-to="treeUpper" dock-spawn-dock-ratio="0.33"
            style="overflow: hidden; width: 100%;">
            <node-projects-tree-view-extended name="tree" id="treeViewExtended"></node-projects-tree-view-extended>
          </div>
      
          <div id="aiDock" title="AI assistant" dock-spawn-dock-type="right" dock-spawn-dock-ratio="0.32" style="overflow: hidden; width: 100%;">
            <iobroker-webui-ai-panel id="aiPanel"></iobroker-webui-ai-panel>
          </div>

          <div id="attributeDock" title="Properties" dock-spawn-dock-type="right" dock-spawn-dock-ratio="0.2">
            <node-projects-web-component-designer-property-grid-with-header id="propertyGrid"></node-projects-web-component-designer-property-grid-with-header>
          </div>

          <div id="settingsDock" title="Settings" style="overflow: hidden; width: 100%;" dock-spawn-dock-to="attributeDock">
            <iobroker-webui-property-grid id="settingsEditor"></iobroker-webui-property-grid>
          </div>

          <div id="refactorDock" title="Refactor" style="overflow: hidden; width: 100%;" dock-spawn-dock-to="attributeDock">
            <node-projects-refactor-view id="refactorView"></node-projects-refactor-view>
          </div>
          
          <div id="eventsDock" title="Events" dock-spawn-dock-type="down" dock-spawn-dock-ratio="0.4" dock-spawn-dock-to="attributeDock">
            <iobroker-webui-event-assignment id="eventsList"></iobroker-webui-event-assignment>
          </div>

          <div id="styleDock" title="style" dock-spawn-dock-type="down" dock-spawn-dock-ratio="0.25" style="overflow: hidden; width: 100%;">
            <iobroker-webui-monaco-editor language="css" id="styleEditor"></iobroker-webui-monaco-editor>
          </div>

          <div id="javascriptDock" title="javascript" dock-spawn-dock-to="styleDock" style="overflow: hidden; width: 100%;">
            <iobroker-webui-monaco-editor language="javascript" id="javascriptEditor"></iobroker-webui-monaco-editor>
          </div>

          <div id="propertiesDock" title="control prop." style="overflow: hidden; width: 100%;" dock-spawn-dock-to="eventsDock">
            <iobroker-webui-control-properties-editor id="propertiesEditor"></iobroker-webui-control-properties-editor>
          </div>
        </dock-spawn-ts>
      </div>
    `;
    constructor() {
        super();
        this.scriptSystem = scriptSystem;
        this.bindingsHelper = bindingsHelper;
    }
    createBindableObjectBrowser() {
        return new BindableObjectsBrowser();
    }
    ;
    async ready() {
        this._dock = this._getDomElement('dock');
        this._aiDockElement = this._getDomElement('aiDock');
        this._solutionExplorer = this._getDomElement('solutionExplorer');
        this.treeViewExtended = this._getDomElement('treeViewExtended');
        for (const tree of [this._solutionExplorer, this.treeViewExtended]) {
            tree.shadowRoot.adoptedStyleSheets = [...tree.shadowRoot.adoptedStyleSheets, IobrokerWebuiAppShell.treeStyle];
        }
        this.propertyGrid = this._getDomElement('propertyGrid');
        this.styleEditor = this._getDomElement('styleEditor');
        this.javascriptEditor = this._getDomElement('javascriptEditor');
        this.controlpropertiesEditor = this._getDomElement('propertiesEditor');
        this.eventsAssignment = this._getDomElement('eventsList');
        this.refactorView = this._getDomElement('refactorView');
        this.settingsEditor = this._getDomElement('settingsEditor');
        this.settingsEditor.getTypeInfo = async (obj, type) => typeInfoFromJsonSchema(propertiesTypeInfo, obj, type);
        this.settingsEditor.propertyChanged.on((prp) => {
            if (prp.property == 'width') {
                this.getActiveScreenEditor()?.setWidth(prp.newValue);
            }
            else if (prp.property == 'height') {
                this.getActiveScreenEditor()?.setHeight(prp.newValue);
            }
        });
        await customElements.whenDefined('dock-spawn-ts');
        const linkElement = document.createElement("link");
        linkElement.rel = "stylesheet";
        linkElement.href = "./assets/dockspawn.css";
        this._dock.shadowRoot.appendChild(linkElement);
        this._dockManager = this._dock.dockManager;
        // Configure before the webcomponent builds its initial panels (deferred initialization).
        this._dockManager.config.tabStripMode = 'wrap';
        this._dockManager.config.enableAutoHide = true;
        this.detachedWindows = new DetachedWindowSupport(this._dockManager, this._dock, element => {
            const code = element instanceof IobrokerWebuiMonacoEditor ? element : element.querySelector('iobroker-webui-monaco-editor');
            return code ?? element;
        }, element => {
            if (element === this._aiDockElement) {
                const panel = this._dockManager.getPanels().find(panel => panel.resolvedElementContent === element);
                if (panel) {
                    this.configureAiPanel(panel);
                    panel.setAutoHide(true, 'right');
                }
            }
        });
        this.serviceContainer = serviceContainer;
        new CommandHandling(this._dockManager, this, serviceContainer);
        this._dockManager.addLayoutListener({
            onActivePanelChange: (_manager, panel) => {
                if (panel?.resolvedElementContent?.id !== 'aiDock')
                    this.lastContentPanel = panel;
            },
            onActiveDocumentChange: async (manager, panel, previousPanel) => {
                if (previousPanel) {
                    let element = previousPanel.resolvedElementContent;
                    if (element?.deactivated)
                        element?.deactivated();
                }
                if (panel) {
                    let element = panel.resolvedElementContent;
                    if (element?.activated)
                        element?.activated();
                }
            },
            onClosePanel: (manager, panel) => {
                if (panel?.undockedToNewBrowserWindow)
                    return;
                if (panel) {
                    let element = panel.resolvedElementContent;
                    if (element === this._aiDockElement) {
                        // Park the live chat outside the dock so closing it preserves running sessions.
                        element.querySelector('#aiPanel')?.stopSpeechInput();
                        this.appendChild(element);
                        return;
                    }
                    if (element?.dispose)
                        element?.dispose();
                }
            }
        });
        await this._setupServiceContainer();
        void iobrokerHandler.waitForReady().then(() => this._aiDockElement.querySelector('#aiPanel').initialize(iobrokerHandler.connection, iobrokerHandler.namespace, new AiWorkspaceAdapter(this), !this.hasAttribute('temporary-ai-sessions'))).catch(error => console.error('Could not initialize AI assistant', error));
        let stateElement = document.getElementById('npmState');
        iobrokerHandler.waitForReady().then(async (x) => {
            iobrokerHandler.connection.subscribeState('webui.0.state.npm', (id, value) => {
                this.npmState = value.val;
                stateElement.innerText = value.val;
            });
            let state = await iobrokerHandler.connection.getState('webui.0.state.npm');
            this.npmState = state.val;
            stateElement.innerText = state.val;
        });
        //@ts-ignore
        this.propertyGrid.propertyGrid.propertyGroupHover = (group) => group.properties?.[0]?.styleDeclaration;
        this.propertyGrid.propertyGrid.propertyContextMenuProvider = (designItems, property) => {
            const ctxMenuItems = property.service.getContextMenu(designItems, property);
            if (property.service.isSet(designItems, property) == ValueType.fromStylesheet) {
                ctxMenuItems.push(...[
                    { title: '-' },
                    {
                        title: 'jump to declaration', action: () => {
                            //@ts-ignore
                            let styleDeclaration = property.styleDeclaration;
                            if (!styleDeclaration)
                                styleDeclaration = designItems[0].getAllStyles().filter(x => x.selector != null).flatMap(x => x.declarations).find(x => x.name == property.name);
                            if (styleDeclaration)
                                //@ts-ignore
                                this.jumpToCss(styleDeclaration.ast, styleDeclaration.stylesheet);
                        }
                    }
                ]);
            }
            ;
            return ctxMenuItems;
        };
        this.propertyGrid.propertyGrid.propertyGroupClick = (group, mode) => {
            //@ts-ignore
            if (group.properties?.[0]?.styleDeclaration?.ast?.parent)
                //@ts-ignore
                this.jumpToCss(group.properties?.[0]?.styleDeclaration?.ast?.parent, group.properties?.[0]?.styleDeclaration?.stylesheet);
            //}
        };
        setTimeout(async () => {
            const aiPanel = this._dockManager.getPanels().find(panel => panel.resolvedElementContent === this._aiDockElement);
            if (aiPanel) {
                this.configureAiPanel(aiPanel);
                aiPanel.setAutoHide(true, 'right');
            }
            this.activateDockById('attributeDock');
            this.activateDockById('eventsDock');
            this.activateDockById('styleDock');
            this._getDomElement('javascriptDock').title = '';
            this._getDomElement('styleDock').title = '';
            await this.applyDefaultDockWidths();
        }, 150);
    }
    async applyDefaultDockWidths() {
        // Auto-hiding AI removes a sibling and redistributes the initial docking ratios.
        // Size the completed layout once; subsequent user resizing remains untouched.
        await this._dock.resize();
        const root = this._dockManager.context.model.rootNode;
        if (!(root.container instanceof SplitterDockContainer) || root.container.stackedVertical || root.children.length !== 3)
            return;
        const branch = (node) => {
            while (node?.parent && node.parent !== root)
                node = node.parent;
            return node;
        };
        const project = branch(this._dockManager.getNodeByElement(this._getDomElement('treeUpper')));
        const properties = branch(this._dockManager.getNodeByElement(this._getDomElement('attributeDock')));
        if (!root.children.includes(project) || !root.children.includes(properties) || project === properties)
            return;
        await root.container.setRatios(root.children.map(child => child === project ? 0.18 : child === properties ? 0.22 : 0.60));
    }
    jumpToCss(styleDeclaration, stylesheet) {
        //@ts-ignore
        const line = styleDeclaration.position?.start?.line;
        //@ts-ignore
        const column = styleDeclaration.position?.start?.column;
        //@ts-ignore
        const lineEnd = styleDeclaration.position?.end?.line;
        //@ts-ignore
        const columnEnd = styleDeclaration.position?.end?.column;
        //@ts-ignore
        if (stylesheet?.designItem) {
            //@ts-ignore
            const di = stylesheet?.designItem;
            let switched = false;
            if (di.instanceServiceContainer.documentContainer.currentView != 'code' &&
                di.instanceServiceContainer.documentContainer.currentView != 'split') {
                switched = true;
                di.instanceServiceContainer.documentContainer.currentView = 'split';
            }
            setTimeout(() => {
                let startPos = column;
                let endPos = columnEnd;
                //@ts-ignore
                const cssCode = stylesheet?.content;
                const lines = cssCode.split('\n');
                for (let n = 0; n < lineEnd - 1; n++) {
                    if (n < line - 1)
                        startPos += lines[n].length + 1;
                    endPos += lines[n].length + 1;
                }
                const selectionPosition = di.instanceServiceContainer.designItemDocumentPositionService.getPosition(di);
                //TODO: style tag could contain attributes
                const styleLength = '<style>'.length;
                di.instanceServiceContainer.documentContainer.codeView.setSelection({ start: startPos + styleLength + selectionPosition.start - 1, length: endPos - startPos });
            }, switched ? 250 : 0);
        }
        else {
            this.styleEditor.showLine(line, column, lineEnd, columnEnd);
        }
    }
    detachedWindows;
    getAllPanels() {
        return [...new Set([...this._dockManager.getPanels(), ...(this.detachedWindows?.panels.keys() ?? [])])];
    }
    async _setupServiceContainer() {
        this._solutionExplorer.initialize(serviceContainer);
        this.propertyGrid.serviceContainer = serviceContainer;
    }
    /* Move to a Dock Spawn Helper */
    activateDockById(name) {
        if (name === 'aiDock') {
            this.showAiAssistant();
            return;
        }
        const panel = this.getAllPanels().find(panel => panel.resolvedElementContent.id === name);
        if (panel && this.detachedWindows.focus(panel))
            return;
        this.activateDock(this._getDomElement(name));
    }
    configureAiPanel(panel) {
        panel.elementButtonClose.setAttribute('role', 'button');
        panel.elementButtonClose.setAttribute('aria-label', 'Close AI assistant');
        panel.elementButtonClose.tabIndex = 0;
        panel.elementButtonClose.onkeydown = event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                panel.close();
            }
        };
    }
    showAiAssistant() {
        const element = this._aiDockElement;
        if (!element)
            return;
        const detached = this.getAllPanels().find(panel => panel.resolvedElementContent === element);
        if (detached && this.detachedWindows.focus(detached))
            return;
        if (element.parentElement !== this._dock) {
            this._dock.appendChild(element);
            // The dock observes appended children and creates the new panel in this microtask.
            queueMicrotask(() => {
                const panel = this._dockManager.getPanels().find(panel => panel.resolvedElementContent === element);
                if (panel) {
                    this.configureAiPanel(panel);
                    panel.setAutoHide(true, 'right');
                }
                if (panel)
                    this._dockManager.autoHideManager.show(panel);
            });
        }
        else
            this.activateDock(element);
    }
    activateDock(element) {
        const panel = this._dockManager.getPanels().find(panel => panel.resolvedElementContent === element);
        if (panel?.isAutoHidden) {
            this._dockManager.autoHideManager.show(panel);
            return;
        }
        const nd = this._dockManager.getNodeByElement(element);
        nd?.parent?.container.setActiveChild(nd.container);
    }
    isDockOpenAndActivate(id) {
        const panel = this.getAllPanels().find(panel => panel.resolvedElementContent.id === id);
        if (!panel)
            return false;
        if (!this.detachedWindows.focus(panel))
            this.activateDock(panel.resolvedElementContent);
        return true;
    }
    openDock(element) {
        element.setAttribute('dock-spawn-panel-type', 'document');
        //todo: why are this 2 styles needed? needs a fix in dock-spawn
        element.style.zIndex = '1';
        this._dock.appendChild(element);
        setTimeout(() => element.title = '', 100);
    }
    openDialog(element, options) {
        element.setAttribute('dock-spawn-panel-type', 'document');
        //todo: why are this 2 styles needed? needs a fix in dock-spawn
        element.style.zIndex = '1';
        element.style.position = 'relative';
        let container = new PanelContainer(element, this._dock.dockManager, element.title, PanelType.panel);
        element.title = '';
        let d = this._dock.dockManager.floatDialog(container, options.x, options.y, getPanelContainerForElement(options.parent), options.disableResize ?? false);
        d.resize(options.width, options.height);
        d.noDocking = true;
        return { close: () => container.close() };
    }
    openConfirmation(element, options) {
        return new Promise((resolve) => {
            let cw = new IobrokerWebuiConfirmationWrapper({ okText: options.confirmText, cancelText: options.cancelText });
            cw.title = options.title ?? element.title;
            cw.appendChild(element);
            let settled = false;
            const finish = (result) => {
                if (settled)
                    return;
                settled = true;
                dlg.close();
                resolve(result);
            };
            if (options.abortSignal) {
                options.abortSignal.addEventListener('abort', () => finish(false), { once: true });
            }
            let dlg = window.appShell.openDialog(cw, {
                x: options.x ?? 100,
                y: options.y ?? 100,
                width: options.width ?? 500,
                height: options.height ?? 400,
                parent: options.parent,
                disableResize: options.disableResize
            });
            cw.okClicked.on(() => {
                finish(true);
            });
            cw.cancelClicked.on(() => {
                finish(false);
            });
        });
    }
    openModal(element, options) {
        return new Promise((resolve) => {
            if (options.title)
                element.title = options.title;
            const width = options.width ?? 500;
            const height = options.height ?? 400;
            const dockBounds = this._dock.getBoundingClientRect();
            const position = fitDialogPosition(options.x, options.y, width, height, dockBounds);
            const container = new PanelContainer(element, this._dock.dockManager, element.title, PanelType.panel);
            element.title = '';
            const dialog = this._dock.dockManager.floatDialog(container, position.x, position.y, getPanelContainerForElement(options.parent), options.disableResize ?? false);
            dialog.resize(width, height);
            dialog.noDocking = true;
            const listener = {
                onClosePanel: (_manager, panel) => {
                    if (panel !== container)
                        return;
                    this._dock.dockManager.removeLayoutListener(listener);
                    resolve();
                }
            };
            this._dock.dockManager.addLayoutListener(listener);
            options.abortSignal?.addEventListener('abort', () => container.close(), { once: true });
        });
    }
    getAiWindows() {
        const panels = this.getAllPanels();
        const active = this._dockManager.activePanel;
        const content = panels.includes(this.lastContentPanel) ? this.lastContentPanel : this._dockManager.activeDocument;
        return panels.map(panel => {
            const element = panel.resolvedElementContent;
            if (!this.aiWindowIds.has(panel))
                this.aiWindowIds.set(panel, element.id || `window-${++this.nextAiWindowId}`);
            const screen = element instanceof IobrokerWebuiScreenEditor ? element : null;
            const code = element instanceof IobrokerWebuiMonacoEditor ? element : element.querySelector('iobroker-webui-monaco-editor');
            const owner = screen ?? (code ? this.getScreenEditors().find(editor => editor.scriptModel === code.model || editor.documentContainer.additionalData?.model === code.model) : null);
            return { id: this.aiWindowIds.get(panel), title: panel.title, tag: element.localName, kind: screen ? 'document' : code ? 'code' : 'tool', active: panel === active, current: panel === content, autoHidden: panel.isAutoHidden, detached: this.detachedWindows.panels.has(panel),
                document: owner ? { type: owner.documentType, name: owner.name } : null };
        });
    }
    getAiWindowElement(id) {
        this.getAiWindows();
        return this.getAllPanels().find(panel => this.aiWindowIds.get(panel) === id)?.resolvedElementContent;
    }
    getScreenEditors() {
        return this.getAllPanels()
            .map(panel => panel.resolvedElementContent)
            .filter((element) => element instanceof IobrokerWebuiScreenEditor);
    }
    getActiveScreenEditor() {
        const element = this._dock.dockManager.activeDocument?.resolvedElementContent;
        return element instanceof IobrokerWebuiScreenEditor ? element : null;
    }
    showComponentCatalog() {
        if (!this._catalogDock) {
            this._catalogDock = document.createElement('div');
            this._catalogDock.id = 'catalogDock';
            this._catalogDock.title = 'Catalog';
            this._catalogDock.setAttribute('dock-spawn-title', 'Catalog');
            this._catalogDock.setAttribute('dock-spawn-dock-to', 'treeUpper');
            this._catalogDock.style.cssText = 'overflow: hidden; width: 100%; height: 100%';
            this._catalog = new IobrokerWebuiComponentCatalog();
            this._catalogDock.append(this._catalog);
        }
        this._catalog.refresh(serviceContainer);
        const panel = this.getAllPanels().find(panel => panel.resolvedElementContent === this._catalogDock);
        if (panel && this.detachedWindows.focus(panel))
            return;
        if (this._catalogDock.parentElement !== this._dock)
            this._dock.append(this._catalogDock);
        queueMicrotask(() => this.activateDock(this._catalogDock));
    }
    async openScreenEditor(name, type, html, style, script, settings, properties) {
        this.showComponentCatalog();
        let id = type + "_" + name;
        if (!this.isDockOpenAndActivate(id)) {
            let screenEditor = new IobrokerWebuiScreenEditor();
            screenEditor.id = id;
            await screenEditor.initialize(name, type, html, style, script, settings, properties, serviceContainer);
            this.openDock(screenEditor);
            return screenEditor;
        }
        return this.getScreenEditors().find(editor => editor.id === id);
    }
    async openGlobalStyleEditor(style, title, editPart) {
        let id = "global_styleEditor";
        if (!this.isDockOpenAndActivate(id)) {
            let styleEditor = new IobrokerWebuiMonacoEditor();
            styleEditor.language = 'css';
            styleEditor.editPart = editPart;
            styleEditor.id = id;
            styleEditor.title = title;
            const model = await styleEditor.createModel(style);
            styleEditor.model = model;
            this.openDock(styleEditor);
        }
    }
    async openGlobalConfigEditor() {
        let id = "global_ConfigEditor";
        if (!this.isDockOpenAndActivate(id)) {
            let pg = new IobrokerWebuiPropertyGrid();
            pg.visualizationShell = this;
            pg.id = id;
            pg.getTypeInfo = async (obj, type) => typeInfoFromJsonSchema(propertiesTypeInfo, obj, type);
            pg.typeName = 'IGlobalConfig';
            pg.selectedObject = iobrokerHandler.config?.globalConfig ?? {};
            pg.saveCallback = async (data) => {
                iobrokerHandler.config.globalConfig = data;
                await iobrokerHandler.saveConfig();
            };
            pg.title = 'global config';
            this.openDock(pg);
        }
    }
    async openGlobalScriptEditor(script) {
        let id = "global_scriptEditor";
        if (!this.isDockOpenAndActivate(id)) {
            let scriptEditor = new IobrokerWebuiMonacoEditor();
            scriptEditor.language = 'javascript';
            scriptEditor.id = id;
            scriptEditor.title = 'global typescript';
            const model = await scriptEditor.createModel(script);
            scriptEditor.model = model;
            this.openDock(scriptEditor);
        }
    }
}
window.customElements.define('iobroker-webui-app-shell', IobrokerWebuiAppShell);
const err = console.error;
console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string' && args[0].startsWith('Cannot getState ')) {
        console.warn(...args);
    }
    else {
        err(...args);
        try {
            Toastify({
                text: "Error occured, check console \n" + args[0],
                duration: 4000,
                close: true,
                gravity: "top",
                position: "right",
                stopOnFocus: true,
                style: {
                    color: "black",
                    background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                }
            }).showToast();
        }
        catch { }
    }
};
