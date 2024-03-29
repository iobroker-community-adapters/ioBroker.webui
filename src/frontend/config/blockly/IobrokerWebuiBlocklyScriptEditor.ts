import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
import toolbox from './IobrokerWebuiBlocklyToolbox.js'
//import Blockly from 'blockly';

export class IobrokerWebuiBlocklyScriptEditor extends BaseCustomWebComponentConstructorAppend {

    static readonly template = html`
        <div id="blocklyDiv" style="position: absolute; width: 100%; height: 100%;"></div>
    `;

    static readonly style = css`
        :host {
            box-sizing: border-box;
            position: absolute;
            height: 100%;
            width: 100%;
        }`;

    static readonly is = 'iobroker-webui-blockly-script-editor';

    blocklyDiv: HTMLDivElement;
    workspace: any;
    static blocklyStyle1: CSSStyleSheet;
    static blocklyStyle2: CSSStyleSheet;
    resizeObserver: ResizeObserver;

    constructor() {
        super();
        super._restoreCachedInititalValues();

        this.blocklyDiv = this._getDomElement<HTMLDivElement>('blocklyDiv');

        this._assignEvents();
        this.createBlockly();
    }

    createBlockly() {
        const renderer = 'zelos';
        const themename = 'webui';

        //@ts-ignore
        const theme = Blockly.Theme.defineTheme(themename, {
            //@ts-ignore
            'base': Blockly.Themes.Classic,
            'blockStyles': {
                "hat_blocks": {
                    "colourPrimary": "#4a148c"
                }
            },
            'categoryStyles': {
                'start_category': {
                    colour: '#4a148c'
                },
                'system_category': {
                    colour: '#01579b',
                }
            },
        });

        //@ts-ignore
        this.workspace = Blockly.inject(this.blocklyDiv, {
            theme: theme,
            toolbox: toolbox,
            renderer: renderer,
            trashcan: true,
            zoom: {
                controls: true,
                wheel: false,
                startScale: 0.7,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2,
                pinch: false
            },
            move: {
                scrollbars: {
                    horizontal: true,
                    vertical: true
                },
                drag: true,
                wheel: true
            },
            maxInstances: { 'start_event': 1 },
        });

        if (!IobrokerWebuiBlocklyScriptEditor.blocklyStyle1) {
            IobrokerWebuiBlocklyScriptEditor.blocklyStyle1 = new CSSStyleSheet();
            //@ts-ignore
            IobrokerWebuiBlocklyScriptEditor.blocklyStyle1.replaceSync(<HTMLStyleElement>document.getElementById('blockly-renderer-style-' + renderer + '-' + themename).innerText);
            IobrokerWebuiBlocklyScriptEditor.blocklyStyle2 = new CSSStyleSheet();
            //@ts-ignore
            IobrokerWebuiBlocklyScriptEditor.blocklyStyle2.replaceSync(<HTMLStyleElement>document.getElementById('blockly-common-style').innerText);
        }
        this.shadowRoot.adoptedStyleSheets = [IobrokerWebuiBlocklyScriptEditor.blocklyStyle1, IobrokerWebuiBlocklyScriptEditor.blocklyStyle2, IobrokerWebuiBlocklyScriptEditor.style];



        //@ts-ignore
        const zoomToFit = new ZoomToFitControl(this.workspace);
        zoomToFit.init();
    }

    ready() {
        //@ts-ignore
        Blockly.svgResize(this.workspace);

        this.resizeObserver = new ResizeObserver((entries) => {
            //@ts-ignore
            Blockly.svgResize(this.workspace)
        });
        this.resizeObserver.observe(this);
    }

    public save(): any {
        //@ts-ignore
        const state = Blockly.serialization.workspaces.save(this.workspace);
        return state;
    }

    public load(data: any) {
        //@ts-ignore
        Blockly.serialization.workspaces.load(data, this.workspace);
    }
}
customElements.define(IobrokerWebuiBlocklyScriptEditor.is, IobrokerWebuiBlocklyScriptEditor);
