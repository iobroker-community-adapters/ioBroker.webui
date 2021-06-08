import { BaseCustomWebComponentConstructorAppend, css, customElement, html } from "@node-projects/base-custom-webcomponent";
import { screensPrefix } from "../Constants";
import Connection from '../SetupConnection'
import { AppShell } from './shell';

@customElement("web-ui-list-views")
export class WebUiListViews extends BaseCustomWebComponentConstructorAppend {


    static style = css`
        span.fancytree-expander {
            display: none !important;
        }
    `
    static template = html`
        <div id="root">
            <div id="treetable" style="min-width: 100%;"></div>
        </div>`

    private _treeDiv: HTMLTableElement;
    private _tree: Fancytree.Fancytree;

    public shell: AppShell;

    constructor() {
        super();

        let externalCss = document.createElement('style');
        externalCss.innerHTML = '@import url("./node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css");';
        this.shadowRoot.insertBefore(externalCss, this.shadowRoot.firstChild);

        this._treeDiv = this._getDomElement<HTMLTableElement>('treetable')
    }

    async ready() {
        await Connection.waitForFirstConnection();
        const objects = await Connection.getObjects();
        const screens = Object.getOwnPropertyNames(objects).filter(x => x.startsWith(screensPrefix));

        $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
            icon: true,
            quicksearch: true,
            source: [],
            dblclick: (e, d) => {
                const viewName = d.node.data.ref.common.name;
                Connection.getObject(screensPrefix + viewName).then(obj => {
                    this.shell.openDocument({ name: viewName, html: <any>obj.native.html, bindings: JSON.parse(obj.native.bindings) });
                });
            }
        });

        //@ts-ignore
        this._tree = $.ui.fancytree.getTree(this._treeDiv);

        let rootNode = this._tree.getRootNode();
        rootNode.removeChildren();

        for (const s of screens) {
            rootNode.addChildren({
                title: s.substring(screensPrefix.length),
                //@ts-ignore
                ref: objects[s]
            });
        }
    }
}