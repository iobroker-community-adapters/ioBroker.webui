import { iobrokerHandler } from '../common/IobrokerHandler.js';
import Toastify from 'toastify-js'
//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
iobrokerHandler.init();
const scriptSystem = new IobrokerWebuiScriptSystem(iobrokerHandler);
const bindingsHelper = new BindingsHelper(iobrokerHandler);

LazyLoader.LoadJavascript('./node_modules/monaco-editor/min/vs/loader.js');

import '@node-projects/web-component-designer'
import { PropertyGridWithHeader, RefactorView, ServiceContainer, ValueType } from '@node-projects/web-component-designer';
import { BindableObjectsBrowser, TreeViewExtended } from '@node-projects/web-component-designer-widgets-wunderbaum';

import type { IDisposable } from 'monaco-editor';
import { DockManager, DockSpawnTsWebcomponent, PanelContainer, PanelType } from 'dock-spawn-ts';
import { configureDesigner } from './ConfigureWebcomponentDesigner.js';
const serviceContainer = configureDesigner(bindingsHelper);

import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from '@node-projects/base-custom-webcomponent';
import { CommandHandling } from './CommandHandling.js'
import propertiesTypeInfo from "../generated/Properties.json" with { type: 'json' };

import "../runtime/controls.js";
import "./IobrokerWebuiSolutionExplorer.js";
import "./IobrokerWebuiMonacoEditor.js";
import "./IobrokerWebuiEventAssignment.js";
import "./IobrokerWebuiPropertyGrid.js";
import "./IobrokerWebuiControlPropertiesEditor.js";

import { IobrokerWebuiSolutionExplorer } from './IobrokerWebuiSolutionExplorer.js';
import { IobrokerWebuiMonacoEditor } from './IobrokerWebuiMonacoEditor.js';
import { IobrokerWebuiScreenEditor } from './IobrokerWebuiScreenEditor.js';
import { IobrokerWebuiEventAssignment } from './IobrokerWebuiEventAssignment.js';
import { IobrokerWebuiConfirmationWrapper } from './IobrokerWebuiConfirmationWrapper.js';
import { getPanelContainerForElement } from './DockHelper.js';
import { IobrokerWebuiControlPropertiesEditor } from './IobrokerWebuiControlPropertiesEditor.js';
import { IobrokerWebuiPropertyGrid } from './IobrokerWebuiPropertyGrid.js';
import { typeInfoFromJsonSchema } from '@node-projects/propertygrid.webcomponent';
import { IobrokerWebuiScriptSystem } from '../scripting/IobrokerWebuiScriptSystem.js';
import { BindingsHelper, VisualizationShell } from '@node-projects/web-component-designer-visualization-addons';


export class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend implements VisualizationShell {
  activeElement: HTMLElement;
  mainPage = 'designer';

  serviceContainer: ServiceContainer

  private _dock: DockSpawnTsWebcomponent;
  private _dockManager: DockManager;
  _solutionExplorer: IobrokerWebuiSolutionExplorer


  public styleEditor: IobrokerWebuiMonacoEditor;
  public javascriptEditor: IobrokerWebuiMonacoEditor;
  public controlpropertiesEditor: IobrokerWebuiControlPropertiesEditor;
  public propertyGrid: PropertyGridWithHeader;
  public treeViewExtended: TreeViewExtended;
  public eventsAssignment: IobrokerWebuiEventAssignment;
  public settingsEditor: IobrokerWebuiPropertyGrid;
  public refactorView: RefactorView;
  public npmState: string;

  public scriptSystem: IobrokerWebuiScriptSystem;
  public bindingsHelper: BindingsHelper;

  static readonly style = css`
    :host {
      display: block;
      box-sizing: border-box;
      position: relative;

      /* Default colour scheme */
      --canvas-background: white;
      --almost-black: #141720;
      --dark-grey: #232733;
      --medium-grey: #2f3545;
      --light-grey: #383f52;
      --highlight-pink: #e91e63;
      --highlight-blue: #2196f3;
      --highlight-green: #99ff33;
      --input-border-color: #596c7a;
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

  static readonly template = html`
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
  };

  async ready() {
    this._dock = this._getDomElement('dock');
    this._solutionExplorer = this._getDomElement<IobrokerWebuiSolutionExplorer>('solutionExplorer');

    this.treeViewExtended = this._getDomElement<TreeViewExtended>('treeViewExtended');
    this.propertyGrid = this._getDomElement<PropertyGridWithHeader>('propertyGrid');
    this.styleEditor = this._getDomElement<IobrokerWebuiMonacoEditor>('styleEditor');
    this.javascriptEditor = this._getDomElement<IobrokerWebuiMonacoEditor>('javascriptEditor');
    this.controlpropertiesEditor = this._getDomElement<IobrokerWebuiControlPropertiesEditor>('propertiesEditor');
    this.eventsAssignment = this._getDomElement<IobrokerWebuiEventAssignment>('eventsList');
    this.refactorView = this._getDomElement<RefactorView>('refactorView');

    this.settingsEditor = this._getDomElement<IobrokerWebuiPropertyGrid>('settingsEditor');
    this.settingsEditor.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(propertiesTypeInfo, obj, type);
    this.settingsEditor.propertyChanged.on((prp) => {
      if (prp.property == 'width') {
        if (this._dockManager.activeDocument instanceof IobrokerWebuiScreenEditor)
          this._dockManager.activeDocument.setWidth(prp.newValue);
      } else if (prp.property == 'height') {
        if (this._dockManager.activeDocument instanceof IobrokerWebuiScreenEditor)
          this._dockManager.activeDocument.setHeight(prp.newValue);
      }
    })

    await customElements.whenDefined('dock-spawn-ts');
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "./assets/dockspawn.css";
    this._dock.shadowRoot.appendChild(linkElement);

    this._dockManager = this._dock.dockManager;
    this.serviceContainer = serviceContainer;
    new CommandHandling(this._dockManager, this, serviceContainer);

    this._dockManager.addLayoutListener({
      onActiveDocumentChange: async (manager, panel, previousPanel) => {
        if (previousPanel) {
          let element = this._dock.getElementInSlot((<HTMLSlotElement><any>previousPanel.elementContent));
          if ((<any>element)?.deactivated)
            (<any>element)?.deactivated();
        }
        if (panel) {
          let element = this._dock.getElementInSlot((<HTMLSlotElement><any>panel.elementContent));
          if ((<any>element)?.activated)
            (<any>element)?.activated();
        }
      },
      onClosePanel: (manager, panel) => {
        if (panel) {
          let element = this._dock.getElementInSlot((<HTMLSlotElement><any>panel.elementContent));
          if ((<IDisposable><any>element)?.dispose)
            (<IDisposable><any>element)?.dispose();
        }
      }
    });

    await this._setupServiceContainer();

    let stateElement = <HTMLDivElement>document.getElementById('npmState');
    iobrokerHandler.waitForReady().then(async x => {
      iobrokerHandler.connection.subscribeState('webui.0.state.npm', (id, value) => {
        this.npmState = <any>value.val;
        stateElement.innerText = <any>value.val;
      });
      let state = await iobrokerHandler.connection.getState('webui.0.state.npm');
      this.npmState = <any>state.val;
      stateElement.innerText = <any>state.val;
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
      };
      return ctxMenuItems;
    }
    this.propertyGrid.propertyGrid.propertyGroupClick = (group, mode) => {
      //@ts-ignore
      if (group.properties?.[0]?.styleDeclaration?.ast?.parent)
        //@ts-ignore
        this.jumpToCss(group.properties?.[0]?.styleDeclaration?.ast?.parent, group.properties?.[0]?.styleDeclaration?.stylesheet);
      //}
    };

    setTimeout(() => {
      this.activateDockById('attributeDock');
      this.activateDockById('eventsDock');
      this.activateDockById('styleDock');
      this._getDomElement<HTMLElement>('javascriptDock').title = '';
      this._getDomElement<HTMLElement>('styleDock').title = '';
    }, 150);
  }

  private jumpToCss(styleDeclaration, stylesheet) {
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
      const di: DesignItem = stylesheet?.designItem;
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
        const cssCode: string = stylesheet?.content;
        const lines = cssCode.split('\n')
        for (let n = 0; n < lineEnd - 1; n++) {
          if (n < line - 1)
            startPos += lines[n].length + 1;
          endPos += lines[n].length + 1;
        }
        const selectionPosition = di.instanceServiceContainer.designItemDocumentPositionService.getPosition(di);
        //TODO: style tag could contain attributes
        const styleLength = '<style>'.length
        di.instanceServiceContainer.documentContainer.codeView.setSelection({ start: startPos + styleLength + selectionPosition.start - 1, length: endPos - startPos });
      }, switched ? 250 : 0);
    } else {
      this.styleEditor.showLine(line, column, lineEnd, columnEnd);
    }
  }

  private async _setupServiceContainer() {
    this._solutionExplorer.initialize(serviceContainer);
    this.propertyGrid.serviceContainer = serviceContainer;
  }


  /* Move to a Dock Spawn Helper */

  activateDockById(name: string) {
    this.activateDock(this._getDomElement(name));
  }

  activateDock(element: Element) {
    const nd = this._dockManager.getNodeByElement(element);
    nd.parent.container.setActiveChild(nd.container);
  }

  isDockOpenAndActivate(id: string) {
    let panels = this._dock.dockManager.getPanels();
    for (let p of panels) {
      if (p.elementContent instanceof HTMLSlotElement) {
        let ct = p.elementContent.assignedElements()[0];
        if (ct?.id == id) {
          this._dock.dockManager.context.documentManagerView.tabHost.setActiveTab(p);
          return true;
        }
      }
    }
    return false;
  }

  openDock(element: HTMLElement) {
    element.setAttribute('dock-spawn-panel-type', 'document');
    //todo: why are this 2 styles needed? needs a fix in dock-spawn
    element.style.zIndex = '1';
    this._dock.appendChild(element);
    setTimeout(() => element.title = '', 100);
  }

  openDialog(element: HTMLElement, options: { x: number, y: number, width: number, height: number, parent?: HTMLElement, disableResize?: boolean }): { close: () => void } {
    element.setAttribute('dock-spawn-panel-type', 'document');
    //todo: why are this 2 styles needed? needs a fix in dock-spawn
    element.style.zIndex = '1';
    element.style.position = 'relative';
    let container = new PanelContainer(element as HTMLElement, this._dock.dockManager, element.title, PanelType.panel);
    element.title = '';
    let d = this._dock.dockManager.floatDialog(container, options.x, options.y, getPanelContainerForElement(options.parent), options.disableResize ?? false);
    d.resize(options.width, options.height);
    d.noDocking = true;
    return { close: () => container.close() };
  }

  openConfirmation(element: HTMLElement, options: { x: number, y: number, width: number, height: number, parent?: HTMLElement, abortSignal?: AbortSignal, disableResize?: boolean, additional?: { okText?: string, cancelText?: string } }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let cw = new IobrokerWebuiConfirmationWrapper(options.additional);
      cw.title = element.title;
      cw.appendChild(element);
      if (options.abortSignal) {
        options.abortSignal.onabort = () => {
          dlg.close();
          resolve(false);
        }
      }
      let dlg = window.appShell.openDialog(cw, options);
      cw.okClicked.on(() => {
        dlg.close();
        resolve(true);
      });
      cw.cancelClicked.on(() => {
        dlg.close();
        resolve(false);
      });
    });
  }

  public async openScreenEditor(name: string, type: 'screen' | 'control', html: string, style: string, script: string, settings: any, properties?: Record<string, { type: string, values?: string[], default?: any }>) {
    let id = type + "_" + name;
    if (!this.isDockOpenAndActivate(id)) {
      let screenEditor = new IobrokerWebuiScreenEditor();
      screenEditor.id = id;
      await screenEditor.initialize(name, type, html, style, script, settings, properties, serviceContainer);
      this.openDock(screenEditor);
    }
  }

  public async openGlobalStyleEditor(style: string, title: string, editPart: 'globalStyle' | 'fontDeclarations') {
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

  public async openGlobalConfigEditor() {
    let id = "global_ConfigEditor";
    if (!this.isDockOpenAndActivate(id)) {
      let pg = new IobrokerWebuiPropertyGrid();
      pg.visualizationShell = this;
      pg.id = id;
      pg.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(propertiesTypeInfo, obj, type);
      pg.typeName = 'IGlobalConfig'
      pg.selectedObject = iobrokerHandler.config?.globalConfig ?? {};
      pg.saveCallback = async (data) => {
        iobrokerHandler.config.globalConfig = data;
        await iobrokerHandler.saveConfig();
      }
      pg.title = 'global config';
      this.openDock(pg);
    }
  }

  public async openGlobalScriptEditor(script: string) {
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

declare global {
  var importShim: (file: string) => any;
  interface Window {
    appShell: IobrokerWebuiAppShell;
  }
}

const err = console.error;
console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string' && args[0].startsWith('Cannot getState ')) {
    console.warn(...args);
  } else {
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
}