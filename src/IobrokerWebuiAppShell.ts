import { iobrokerHandler } from './IobrokerHandler.js';

//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
iobrokerHandler.init();
await LazyLoader.LoadJavascript('./node_modules/monaco-editor/min/vs/loader.js');

import '@node-projects/web-component-designer'

import { BaseCustomWebcomponentBindingsService, JsonFileElementsService, TreeViewExtended, PropertyGrid, NodeHtmlParserService, CodeViewMonaco, createDefaultServiceContainer, CssToolsStylesheetService } from '@node-projects/web-component-designer';
import { IobrokerWebuiBindableObjectsService } from './services/IobrokerWebuiBindableObjectsService.js';
import { IobrokerWebuiBindableObjectDragDropService } from './services/IobrokerWebuiBindableObjectDragDropService.js';
import { IobrokerWebuiBindingService } from './services/IobrokerWebuiBindingService.js';
import { IobrokerWebuiDemoProviderService } from './services/IobrokerWebuiDemoProviderService.js';

const rootPath = new URL(import.meta.url).pathname.split('/').slice(0, -2).join('/'); // -2 remove file & dist

let serviceContainer = createDefaultServiceContainer();
serviceContainer.register("bindingService", new BaseCustomWebcomponentBindingsService());
serviceContainer.register("htmlParserService", new NodeHtmlParserService(rootPath + '/node_modules/@node-projects/node-html-parser-esm/dist/index.js'));
serviceContainer.register("bindableObjectsService", new IobrokerWebuiBindableObjectsService());
serviceContainer.register("bindableObjectDragDropService", new IobrokerWebuiBindableObjectDragDropService());
serviceContainer.register("bindingService", new IobrokerWebuiBindingService());
serviceContainer.register("demoProviderService", new IobrokerWebuiDemoProviderService());
serviceContainer.register("stylesheetService", designerCanvas => new CssToolsStylesheetService(designerCanvas));
serviceContainer.config.codeViewWidget = CodeViewMonaco;

import { DockSpawnTsWebcomponent } from 'dock-spawn-ts/lib/js/webcomponent/DockSpawnTsWebcomponent.js';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager.js';
import { BaseCustomWebComponentConstructorAppend, LazyLoader, css, html } from '@node-projects/base-custom-webcomponent';
import { CommandHandling } from './CommandHandling.js'

DockSpawnTsWebcomponent.cssRootDirectory = "./node_modules/dock-spawn-ts/lib/css/";

import "./widgets/IobrokerWebuiSolutionExplorer.js";
import "./runtime/ScreenViewer.js";
import "./widgets/IobrokerWebuiStyleEditor.js";
import "./controls/SvgImage.js"
import { IobrokerWebuiSolutionExplorer } from './widgets/IobrokerWebuiSolutionExplorer.js';
import { IobrokerWebuiStyleEditor } from './widgets/IobrokerWebuiStyleEditor.js';
import { IDisposable } from 'monaco-editor';
import { IobrokerWebuiScreenEditor } from './widgets/IobrokerWebuiScreenEditor.js';

export class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
  activeElement: HTMLElement;
  mainPage = 'designer';

  private _dock: DockSpawnTsWebcomponent;
  private _dockManager: DockManager;
  _solutionExplorer: IobrokerWebuiSolutionExplorer


  public styleEditor: IobrokerWebuiStyleEditor;
  public propertyGrid: PropertyGrid;
  public treeViewExtended: TreeViewExtended;

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
      overflow: hidden;
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

          <div id="lower" title="style" dock-spawn-dock-type="down" dock-spawn-dock-ratio="0.25" style="overflow: hidden; width: 100%;">
            <iobroker-webui-style-editor id="styleEditor"></iobroker-webui-style-editor>
          </div>
        </dock-spawn-ts>
      </div>
    `;

  async ready() {
    this._dock = this._getDomElement('dock');
    this._solutionExplorer = this._getDomElement<IobrokerWebuiSolutionExplorer>('solutionExplorer');

    this.treeViewExtended = this._getDomElement<TreeViewExtended>('treeViewExtended');
    this.propertyGrid = this._getDomElement<PropertyGrid>('propertyGrid');
    this.styleEditor = this._getDomElement<IobrokerWebuiStyleEditor>('styleEditor');

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "./assets/dockspawn.css";
    this._dock.shadowRoot.appendChild(linkElement);

    this._dockManager = this._dock.dockManager;
    new CommandHandling(this._dockManager, this, serviceContainer);

    this._dockManager.addLayoutListener({
      onActiveDocumentChange: (manager, panel) => {
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
  }

  private async _setupServiceContainer() {
    serviceContainer.register('elementsService', new JsonFileElementsService('webui', './dist/elements-webui.json'));
    serviceContainer.register('elementsService', new JsonFileElementsService('native', './node_modules/@node-projects/web-component-designer/config/elements-native.json'));
    serviceContainer.globalContext.onToolChanged.on((e) => {
      let name = [...serviceContainer.designerTools.entries()].filter(({ 1: v }) => v === e.newValue.tool).map(([k]) => k)[0];
      if (e.newValue == null)
        name = "Pointer"
      const buttons = Array.from<HTMLButtonElement>(document.getElementById('tools').querySelectorAll('[data-command]'));
      for (const b of buttons) {
        if (b.dataset.commandParameter == name)
          b.style.backgroundColor = "green"
        else
          b.style.backgroundColor = ""
      }
    });

    //await this.loadNpmPackages();
    this._solutionExplorer.initialize(serviceContainer);
    this.propertyGrid.serviceContainer = serviceContainer;
  }

  /*async loadNpmPackages() {
    let promises: Promise<void>[] = [];
    try {
      //todo: do not access connection from here
      let packageJson = JSON.parse(await (await iobrokerHandler.connection.readFile(iobrokerHandler.adapterName, "widgets/package.json", false)).file);
      for (let name of Object.keys(packageJson.dependencies)) {
        promises.push(this.loadNpmPackage(name))
      }
      await Promise.allSettled(promises);
    }
    catch (err) {
      console.warn("error loading package.json, may not yet exist", err);
    }
  }*/

  /*private async loadNpmPackage(name: string) {
    try {
      let packageJson = JSON.parse(await (await iobrokerHandler.connection.readFile(iobrokerHandler.adapterName, "widgets/node_modules/" + name + "/package.json", false)).file);
      let customElementsJsonName = "custom-elements.json";
      if (packageJson["customElements"])
        customElementsJsonName = packageJson["customElements"];
      try {
        let manifest = JSON.parse(await (await iobrokerHandler.connection.readFile(iobrokerHandler.adapterName, "widgets/node_modules/" + name + "/" + customElementsJsonName, false)).file);
        try {
          serviceContainer.registerMultiple(['elementsService', 'propertyService'], new WebcomponentManifestParserService(name, manifest, "/webui/widgets/node_modules/" + name + ""));
        }
        catch (err) {
          console.warn("error parsing manifest: " + name + "/" + customElementsJsonName, err);
        }
      }
      catch (err) {
        console.warn("error loading " + name + "/" + customElementsJsonName + ", may not yet exist", err);
      }
    }
    catch (err) {
      console.warn("error loading " + name + "/package.json, may not yet exist", err);
    }
  }*/

  openDock(element: HTMLElement) {
    element.setAttribute('dock-spawn-panel-type', 'document');
    //todo: why are this 2 styles needed? needs a fix in dock-spawn
    element.style.zIndex = '1';
    element.style.position = 'relative'
    this._dock.appendChild(element);
  }
  public async openScreenEditor(name: string, html: string, style: string) {
    let screenEditor = new IobrokerWebuiScreenEditor();
    await screenEditor.initialize(name, html, style, serviceContainer);
    screenEditor.title = 'screen - ' + name;
    this.openDock(screenEditor);
  }

  public async openGlobalStyleEditor(style: string) {
    let styleEditor = new IobrokerWebuiStyleEditor();
    styleEditor.title = 'global style';
    const model = await styleEditor.createModel(style);
    styleEditor.model = model;
    this.openDock(styleEditor);
  }
}

window.customElements.define('iobroker-webui-app-shell', IobrokerWebuiAppShell);

declare global {
  interface Window {
    appShell: IobrokerWebuiAppShell;
  }
}