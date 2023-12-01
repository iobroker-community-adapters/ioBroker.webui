import { iobrokerHandler } from '../common/IobrokerHandler.js';
//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
iobrokerHandler.init();
LazyLoader.LoadJavascript('./node_modules/monaco-editor/min/vs/loader.js');

import '@node-projects/web-component-designer'
import { PropertyGrid, ServiceContainer } from '@node-projects/web-component-designer';
import { TreeViewExtended } from '@node-projects/web-component-designer-widgets-wunderbaum';

import type { IDisposable } from 'monaco-editor';
import { PanelContainer } from 'dock-spawn-ts/lib/js/PanelContainer.js';
import { PanelType } from 'dock-spawn-ts/lib/js/enums/PanelType.js';
import serviceContainer from './ConfigureWebcomponentDesigner.js';

import { DockSpawnTsWebcomponent } from 'dock-spawn-ts/lib/js/webcomponent/DockSpawnTsWebcomponent.js';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager.js';
import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from '@node-projects/base-custom-webcomponent';
import { CommandHandling } from './CommandHandling.js'
import propertiesTypeInfo from "../generated/Properties.json" assert { type: 'json' };

DockSpawnTsWebcomponent.cssRootDirectory = "./node_modules/dock-spawn-ts/lib/css/";

import "../runtime/controls.js";
import "./IobrokerWebuiSolutionExplorer.js";
import "./IobrokerWebuiMonacoEditor.js";
import "./IobrokerWebuiEventAssignment.js";
import "./IobrokerWebuiSplitView.js";
import "./IobrokerWebuiPropertyGrid.js";
import "./IobrokerWebuiControlPropertiesEditor.js";

import { IobrokerWebuiSolutionExplorer } from './IobrokerWebuiSolutionExplorer.js';
import { IobrokerWebuiMonacoEditor } from './IobrokerWebuiMonacoEditor.js';
import { IobrokerWebuiScreenEditor } from './IobrokerWebuiScreenEditor.js';
import { IobrokerWebuiEventAssignment } from './IobrokerWebuiEventAssignment.js';
import { IobrokerWebuiConfirmationWrapper } from './IobrokerWebuiConfirmationWrapper.js';
import { getPanelContainerForElement } from './DockHelper.js';
import { IobrokerWebuiControlPropertiesEditor } from './IobrokerWebuiControlPropertiesEditor.js';
import { IobrokerWebuiPropertyGrid, typeInfoFromJsonSchema } from './IobrokerWebuiPropertyGrid.js';

export class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
  activeElement: HTMLElement;
  mainPage = 'designer';

  serviceContainer: ServiceContainer

  private _dock: DockSpawnTsWebcomponent;
  private _dockManager: DockManager;
  _solutionExplorer: IobrokerWebuiSolutionExplorer


  public styleEditor: IobrokerWebuiMonacoEditor;
  public javascriptEditor: IobrokerWebuiMonacoEditor;
  public controlpropertiesEditor: IobrokerWebuiControlPropertiesEditor;
  public propertyGrid: PropertyGrid;
  public treeViewExtended: TreeViewExtended;
  public eventsAssignment: IobrokerWebuiEventAssignment;
  public settingsEditor: IobrokerWebuiPropertyGrid;
  public npmState: string;

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
            <node-projects-property-grid-with-header id="propertyGrid"></node-projects-property-grid-with-header>
          </div>

          <div id="settingsDock" title="Settings" style="overflow: hidden; width: 100%;" dock-spawn-dock-to="attributeDock">
            <iobroker-webui-property-grid id="settingsEditor"></iobroker-webui-property-grid>
          </div>
          
          <div id="eventsDock" title="Events" dock-spawn-dock-type="down" dock-spawn-dock-ratio="0.4" dock-spawn-dock-to="attributeDock">
            <iobroker-webui-event-assignment id="eventsList"></iobroker-webui-event-assignment>
          </div>

          <div id="styleDock" title="style" dock-spawn-dock-type="down" dock-spawn-dock-ratio="0.25" style="overflow: hidden; width: 100%;">
            <iobroker-webui-monaco-editor language="css" id="styleEditor"></iobroker-webui-monaco-editor>
          </div>

          <div id="javascriptDock" title="javascript" dock-spawn-dock-to="styleDock" style="overflow: hidden; width: 100%;">
            <iobroker-webui-monaco-editor language="typescript" id="javascriptEditor"></iobroker-webui-monaco-editor>
          </div>

          <div id="propertiesDock" title="control prop." style="overflow: hidden; width: 100%;" dock-spawn-dock-to="eventsDock">
            <iobroker-webui-control-properties-editor id="propertiesEditor"></iobroker-webui-control-properties-editor>
          </div>
        </dock-spawn-ts>
      </div>
    `;

  async ready() {
    this._dock = this._getDomElement('dock');
    this._solutionExplorer = this._getDomElement<IobrokerWebuiSolutionExplorer>('solutionExplorer');

    this.treeViewExtended = this._getDomElement<TreeViewExtended>('treeViewExtended');
    this.propertyGrid = this._getDomElement<PropertyGrid>('propertyGrid');
    this.styleEditor = this._getDomElement<IobrokerWebuiMonacoEditor>('styleEditor');
    this.javascriptEditor = this._getDomElement<IobrokerWebuiMonacoEditor>('javascriptEditor');
    this.controlpropertiesEditor = this._getDomElement<IobrokerWebuiControlPropertiesEditor>('propertiesEditor');
    this.eventsAssignment = this._getDomElement<IobrokerWebuiEventAssignment>('eventsList');

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

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "./assets/dockspawn.css";
    this._dock.shadowRoot.appendChild(linkElement);

    this._dockManager = this._dock.dockManager;
    this.serviceContainer = serviceContainer;
    new CommandHandling(this._dockManager, this, serviceContainer);

    this._dockManager.addLayoutListener({
      onActiveDocumentChange: (manager, panel, previousPanel) => {
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

    setTimeout(() => {
      this.activateDockById('attributeDock');
      this.activateDockById('eventsDock');
      this.activateDockById('styleDock');
    }, 150);
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
  }

  openDialog(element: HTMLElement, x: number, y: number, width: number, height: number, parent?: HTMLElement, disableResize?: boolean): { close: () => void } {
    element.setAttribute('dock-spawn-panel-type', 'document');
    //todo: why are this 2 styles needed? needs a fix in dock-spawn
    element.style.zIndex = '1';
    element.style.position = 'relative';
    let container = new PanelContainer(element as HTMLElement, this._dock.dockManager, element.title, PanelType.panel);
    element.title = '';
    let d = this._dock.dockManager.floatDialog(container, x, y, getPanelContainerForElement(parent), disableResize ?? false);
    d.resize(width, height);
    d.noDocking = true;
    return { close: () => container.close() };
  }

  openConfirmation(element: HTMLElement, x: number, y: number, width: number, height: number, parent?: HTMLElement, signal?: AbortSignal, disableResize?: boolean): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let cw = new IobrokerWebuiConfirmationWrapper();
      cw.title = element.title;
      cw.appendChild(element);
      if (signal) {
        signal.onabort = () => {
          dlg.close();
          resolve(false);
        }
      }
      let dlg = window.appShell.openDialog(cw, x, y, width, height, parent, disableResize);
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

  public async openGlobalStyleEditor(style: string, title: string, editPart: 'globalStyle'|'fontDeclarations') {
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
      pg.id = id;
      pg.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(propertiesTypeInfo, obj, type);
      pg.typeName = 'IGlobalConfig'
      pg.selectedObject = iobrokerHandler.config ?? {};
      pg.title = 'global config';
      this.openDock(pg);
    }
  }

  public async openGlobalScriptEditor(script: string) {
    let id = "global_scriptEditor";
    if (!this.isDockOpenAndActivate(id)) {
      let scriptEditor = new IobrokerWebuiMonacoEditor();
      scriptEditor.language = 'typescript';
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

