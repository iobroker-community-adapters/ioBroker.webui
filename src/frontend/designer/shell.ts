import { JsonFileElementsService, ISelectionChangedEvent, TreeView, TreeViewExtended, PaletteView, PropertyGrid, DocumentContainer } from '@node-projects/web-component-designer';
import serviceContainer from '@node-projects/web-component-designer/dist/elements/services/DefaultServiceBootstrap';

import { DockSpawnTsWebcomponent } from 'dock-spawn-ts/lib/js/webcomponent/DockSpawnTsWebcomponent';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager';
import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

DockSpawnTsWebcomponent.cssRootDirectory = "./node_modules/dock-spawn-ts/lib/css/";

export class AppShell extends BaseCustomWebComponentConstructorAppend {
    activeElement: HTMLElement;
    mainPage = 'designer';

    private _documentNumber: number = 0;
    private _dock: DockSpawnTsWebcomponent;
    private _dockManager: DockManager;
    _paletteView: PaletteView;
    _propertyGrid: PropertyGrid;
    _treeView: TreeView;
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
      padding-top: 60px;
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
      <div class="app-header">
        <span class="heavy">web-component-designer <span class="lite">// a design framework for web-components using
            web-components</span></span>
        <button id="newButton" style="margin-left: 50px;">new</button>
      </div>
      
      <div class="app-body">
        <dock-spawn-ts id="dock" style="width: 100%; height: 100%; position: relative;">
      
          <div id="treeUpper" title="Tree" dock-spawn-dock-type="left" dock-spawn-dock-ratio="0.2"
            style="overflow: hidden; width: 100%;">
            <node-projects-tree-view name="tree" id="treeView"></node-projects-tree-view>
          </div>
      
          <div title="TreeExtended" dock-spawn-dock-type="down" dock-spawn-dock-to="treeUpper" dock-spawn-dock-ratio="0.5"
            style="overflow: hidden; width: 100%;">
            <node-projects-tree-view-extended name="tree" id="treeViewExtended"></node-projects-tree-view-extended>
          </div>
      
          <div id="attributeDock" title="Properties" dock-spawn-dock-type="right" dock-spawn-dock-ratio="0.2">
            <node-projects-property-grid id="propertyGrid"></node-projects-attribute-editor>
          </div>
          <div title="Elements" dock-spawn-dock-type="down" dock-spawn-dock-to="attributeDock" dock-spawn-dock-ratio="0.4">
            <node-projects-palette-view id="paletteView"></node-projects-palette-view>
          </div>
        </dock-spawn-ts>
      </div>
    `;

    constructor() {
        super();
    }

    ready() {
        this._dock = this._getDomElement('dock');
        this._paletteView = this._getDomElement('paletteView');
        this._treeView = this._getDomElement('treeView');
        this._treeViewExtended = this._getDomElement('treeViewExtended');
        this._propertyGrid = this._getDomElement('propertyGrid');

        let newButton = this._getDomElement<HTMLButtonElement>('newButton');
        newButton.onclick = () => this.newDocument();

        this._dockManager = this._dock.dockManager;

        this._dockManager.addLayoutListener({
            onActivePanelChange: (manager, panel) => {
                if (panel) {
                    let element = ((<HTMLSlotElement><any>panel.elementContent).assignedElements()[0]);
                    if (element && element instanceof DocumentContainer) {
                        let sampleDocument = element as DocumentContainer;

                        sampleDocument.instanceServiceContainer.selectionService.onSelectionChanged.on((e) => this._selectionChanged(e));

                        let selection = sampleDocument.instanceServiceContainer.selectionService.selectedElements;
                        this._propertyGrid.selectedItems = selection;
                        this._treeView.createTree(sampleDocument.instanceServiceContainer.contentService.rootDesignItem);
                        this._treeViewExtended.createTree(sampleDocument.instanceServiceContainer.contentService.rootDesignItem);
                    }
                }
            }
        });

        this._setupServiceContainer();

        this.newDocument();
    }

    private _selectionChanged(e: ISelectionChangedEvent) {
        this._propertyGrid.selectedItems = e.selectedElements;
        this._treeView.selectionChanged(e);
        this._treeViewExtended.selectionChanged(e);
    }

    private _setupServiceContainer() {
        serviceContainer.register('elementsService', new JsonFileElementsService('demo', './src/elements-demo.json'));
        serviceContainer.register('elementsService', new JsonFileElementsService('native', './node_modules/@node-projects/web-component-designer/src/config/elements-native.json'));

        this._paletteView.loadControls(serviceContainer.elementsServices);
        this._propertyGrid.serviceContainer = serviceContainer;
    }

    public newDocument() {
        this._documentNumber++;
        let sampleDocument = new DocumentContainer(serviceContainer);
        sampleDocument.title = "page-" + this._documentNumber;
        this._dock.appendChild(sampleDocument);
    }
}

window.customElements.define('node-projects-app-shell', AppShell);