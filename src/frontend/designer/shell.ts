import { JsonFileElementsService, ISelectionChangedEvent, TreeViewExtended, PaletteView, PropertyGrid, DocumentContainer, NodeHtmlParserService, CodeViewAce } from '@node-projects/web-component-designer';
import serviceContainer from '@node-projects/web-component-designer/dist/elements/services/DefaultServiceBootstrap';
serviceContainer.register("htmlParserService", new NodeHtmlParserService());
serviceContainer.config.codeViewWidget = CodeViewAce;

import { DockSpawnTsWebcomponent } from 'dock-spawn-ts/lib/js/webcomponent/DockSpawnTsWebcomponent';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager';
import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { CommandHandling } from './CommandHandling'

import '../SetupConnection';
import './WebUiListViews';
import '../views/WebUiDisplayView';
import { IView } from '../views/IView';
import { WebUiListViews } from './WebUiListViews';

DockSpawnTsWebcomponent.cssRootDirectory = "./node_modules/dock-spawn-ts/lib/css/";

export class AppShell extends BaseCustomWebComponentConstructorAppend {

  public activeElement: HTMLElement;
  public mainPage = 'designer';

  private _dock: DockSpawnTsWebcomponent;
  private _dockManager: DockManager;
  private _paletteView: PaletteView;
  private _propertyGrid: PropertyGrid;
  private _treeViewExtended: TreeViewExtended;

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
      
          <div id="viewsDock" title="Views" dock-spawn-dock-type="left" dock-spawn-dock-ratio="0.2"
            style="overflow: hidden; width: 100%;">
            <web-ui-list-views name="views" id="views"></web-ui-list-views>
          </div>
      
          <div title="TreeExtended" dock-spawn-dock-type="down" dock-spawn-dock-to="viewsDock" dock-spawn-dock-ratio="0.7"
            style="overflow: hidden; width: 100%;">
            <node-projects-tree-view-extended name="tree" id="treeViewExtended"></node-projects-tree-view-extended>
          </div>
      
          <div id="attributeDock" title="Properties" dock-spawn-dock-type="right" dock-spawn-dock-ratio="0.2">
            <node-projects-property-grid id="propertyGrid"></node-projects-property-grid>
          </div>
          <div id="p" title="Elements" dock-spawn-dock-type="down" dock-spawn-dock-to="attributeDock"
            dock-spawn-dock-ratio="0.4">
            <node-projects-palette-view id="paletteView"></node-projects-palette-view>
          </div>
        </dock-spawn-ts>
      </div>
    `;
  private _views: WebUiListViews;

  async ready() {
    this._dock = this._getDomElement('dock');
    this._paletteView = this._getDomElement('paletteView');
    this._treeViewExtended = this._getDomElement('treeViewExtended');
    this._propertyGrid = this._getDomElement('propertyGrid');
    this._views = this._getDomElement<WebUiListViews>('views');
    this._views.shell = this;

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "../../assets/dockspawn.css";
    this._dock.shadowRoot.appendChild(linkElement);

    this._dockManager = this._dock.dockManager;
    new CommandHandling(this._dockManager, this);

    this._dockManager.addLayoutListener({
      onActivePanelChange: (manager, panel) => {
        if (panel) {
          let element = this._dock.getElementInSlot((<HTMLSlotElement><any>panel.elementContent));
          if (element && element instanceof DocumentContainer) {
            let sampleDocument = element as DocumentContainer;

            sampleDocument.instanceServiceContainer.selectionService.onSelectionChanged.on((e) => this._selectionChanged(e));

            let selection = sampleDocument.instanceServiceContainer.selectionService.selectedElements;
            this._propertyGrid.selectedItems = selection;
            this._treeViewExtended.createTree(sampleDocument.instanceServiceContainer.contentService.rootDesignItem);
          }
        }
      },
      onClosePanel: (manager, panel) => {
        if (panel) {
          let element = this._dock.getElementInSlot((<HTMLSlotElement><any>panel.elementContent));
          if (element && element instanceof DocumentContainer) {
            (<DocumentContainer>element).dispose();
          }
        }
      }
    });

    await this._setupServiceContainer();
  }

  private _selectionChanged(e: ISelectionChangedEvent) {
    this._propertyGrid.selectedItems = e.selectedElements;
    this._treeViewExtended.selectionChanged(e);
  }

  private async _setupServiceContainer() {
    serviceContainer.register('elementsService', new JsonFileElementsService('native', '../../assets/edit/elements.json'));

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

    this._paletteView.loadControls(serviceContainer, serviceContainer.elementsServices);
    this._propertyGrid.serviceContainer = serviceContainer;
  }

  public newDocument() {
    //@ts-ignore
    Metro.dialog.create({
      title: "Screen Name?",
      content: '<input autofocus type="text" data-role="input" data-prepend="Name: ">',
      closeButton: true,
      actions: [
        {
          caption: "Agree",
          cls: "js-dialog-close alert",
          onclick: (r) => {
            const ip = r[0].querySelector('input');

            let sampleDocument = new DocumentContainer(serviceContainer);
            sampleDocument.setAttribute('dock-spawn-panel-type', 'document');
            sampleDocument.title = ip.value;
            this._dock.appendChild(sampleDocument);
          }
        },
        {
          caption: "Disagree",
          cls: "js-dialog-close",
        }
      ]
    });
  }

  public openDocument(view: IView) {
    let sampleDocument = new DocumentContainer(serviceContainer, view.html);
    sampleDocument.setAttribute('dock-spawn-panel-type', 'document');
    sampleDocument.title = view.name;
    this._dock.appendChild(sampleDocument);
  }
}

window.customElements.define('node-projects-app-shell', AppShell);