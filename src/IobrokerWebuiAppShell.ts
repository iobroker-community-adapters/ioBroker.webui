import { BaseCustomWebcomponentBindingsService, JsonFileElementsService, TreeViewExtended, PropertyGrid, DocumentContainer, NodeHtmlParserService, ListPropertiesService, PaletteTreeView, CodeViewMonaco } from '@node-projects/web-component-designer';
import createDefaultServiceContainer from '@node-projects/web-component-designer/dist/elements/services/DefaultServiceBootstrap';

let serviceContainer = createDefaultServiceContainer();
serviceContainer.register("bindingService", new BaseCustomWebcomponentBindingsService());
if (window.location.hostname == 'localhost' || window.location.hostname == '127.0.0.1')
  serviceContainer.register("htmlParserService", new NodeHtmlParserService('/node_modules/@node-projects/node-html-parser-esm/dist/index.js'));
else
  serviceContainer.register("htmlParserService", new NodeHtmlParserService('/web-component-designer-demo/node_modules/@node-projects/node-html-parser-esm/dist/index.js'));
serviceContainer.config.codeViewWidget = CodeViewMonaco;
LazyLoader.LoadText('./dist/custom-element-properties.json').then(data => serviceContainer.register("propertyService", new ListPropertiesService(JSON.parse(data))));

import { DockSpawnTsWebcomponent } from 'dock-spawn-ts/lib/js/webcomponent/DockSpawnTsWebcomponent';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager';
import { BaseCustomWebComponentConstructorAppend, css, html, LazyLoader } from '@node-projects/base-custom-webcomponent';
import { CommandHandling } from './CommandHandling'

DockSpawnTsWebcomponent.cssRootDirectory = "./node_modules/dock-spawn-ts/lib/css/";

import "./IobrokerHandler.js"
import "./widgets/IobrokerSolutionExplorer.js"
import "./runtime/ScreenViewer.js"

export class IobrokerWebuiAppShell extends BaseCustomWebComponentConstructorAppend {
  activeElement: HTMLElement;
  mainPage = 'designer';

  private _dock: DockSpawnTsWebcomponent;
  private _dockManager: DockManager;
  _paletteTree: PaletteTreeView
  _propertyGrid: PropertyGrid;
  _treeViewExtended: TreeViewExtended;

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

    .app-header {
      background-color: var(--almost-black);
      color: white;
      height: 60px;
      width: 100%;
      position: fixed;
      z-index: 100;
      display: flex;
      font-size: var(--app-toolbar-font-size, 20px);
      align-items: center;
      font-weight: 900;
      letter-spacing: 2px;
      padding-left: 10px;
    }

    .app-body {
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      height: 100%;
      overflow: hidden;
    }

    .heavy {
      font-weight: 900;
      letter-spacing: 2px;
    }
    .lite {
      font-weight: 100;
      opacity: 0.5;
      letter-spacing: normal;
    }

    dock-spawn-ts > div {
      height: 100%;
    }

    attribute-editor {
      height: 100%;
      width: 100%;
    }
    `;

  static readonly template = html`
      <div class="app-body">
        <dock-spawn-ts id="dock" style="width: 100%; height: 100%; position: relative;">
          <div id="treeUpper" title="Project" dock-spawn-dock-type="left" dock-spawn-dock-ratio="0.2"
            style="overflow: hidden; width: 100%;">
            <iobroker-solution-explorer></iobroker-solution-explorer>
          </div>
      
          <div title="TreeExtended" dock-spawn-dock-type="down" dock-spawn-dock-to="treeUpper" dock-spawn-dock-ratio="0.5"
            style="overflow: hidden; width: 100%;">
            <node-projects-tree-view-extended name="tree" id="treeViewExtended"></node-projects-tree-view-extended>
          </div>
      
          <div id="attributeDock" title="Properties" dock-spawn-dock-type="right" dock-spawn-dock-ratio="0.2">
            <node-projects-property-grid-with-header id="propertyGrid"></node-projects-property-grid-with-header>
          </div>
          <div id="p" title="Elements" dock-spawn-dock-type="down" dock-spawn-dock-to="attributeDock"
            dock-spawn-dock-ratio="0.4">
            <node-projects-palette-tree-view name="paletteTree" id="paletteTree"></node-projects-palette-tree-view>
          </div>
        </dock-spawn-ts>
      </div>
    `;

  async ready() {
    this._dock = this._getDomElement('dock');
    this._paletteTree = this._getDomElement<PaletteTreeView>('paletteTree');
    this._treeViewExtended = this._getDomElement<TreeViewExtended>('treeViewExtended');
    this._propertyGrid = this._getDomElement<PropertyGrid>('propertyGrid');

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
          if (element && element instanceof DocumentContainer) {
            const document = element as DocumentContainer;
            this._propertyGrid.instanceServiceContainer = document.instanceServiceContainer;
            this._treeViewExtended.instanceServiceContainer = document.instanceServiceContainer;
          }
        }
      },
      onClosePanel: (manager, panel) => {
        if (panel) {
          let element = this._dock.getElementInSlot((<HTMLSlotElement><any>panel.elementContent));
          if (element && element instanceof DocumentContainer) {
            const document = element as DocumentContainer;
            document.dispose();
          }
        }
      }
    });

    await this._setupServiceContainer();
  }

  private async _setupServiceContainer() {
    serviceContainer.register('elementsService', new JsonFileElementsService('webui', './dist/elements-webui.json'));
    serviceContainer.register('elementsService', new JsonFileElementsService('native', './node_modules/@node-projects/web-component-designer/config/elements-native.json'));
    serviceContainer.register('elementsService', new JsonFileElementsService('wired', './dist/elements-wired.json'));
    
    serviceContainer.globalContext.onToolChanged.on((e) => {
      let name = [...serviceContainer.designerTools.entries()].filter(({ 1: v }) => v === e.newValue).map(([k]) => k)[0];
      if (e.newValue == null)
        name = "Pointer"
      const buttons = Array.from<HTMLButtonElement>(document.getElementById('tools').querySelectorAll('[data-command]'));
      for (const b of buttons) {
        if (b.dataset.commandParameter == name)
          b.style.background = "green"
        else
          b.style.background = ""
      }
    });

    this._paletteTree.loadControls(serviceContainer, serviceContainer.elementsServices);
    this._propertyGrid.serviceContainer = serviceContainer;
  }

  public newDocument(name: string, content: string) {
    let sampleDocument = new DocumentContainer(serviceContainer);
    sampleDocument.setAttribute('dock-spawn-panel-type', 'document');
    sampleDocument.title = name;
    this._dock.appendChild(sampleDocument);
    if (content) {
      sampleDocument.designerView.parseHTML(content);
    }
  }
}

window.customElements.define('iobroker-webui-app-shell', IobrokerWebuiAppShell);

declare global {
    interface Window {
        appShell: IobrokerWebuiAppShell;
    }
}