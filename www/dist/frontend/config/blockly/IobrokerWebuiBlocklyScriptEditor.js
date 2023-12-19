import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
import toolbox from './IobrokerWebuiBlocklyToolbox.js';
import { generateEventCodeFromBlockly } from './IobrokerWebuiBlocklyJavascriptHelper.js';
//import Blockly from 'blockly';
export class IobrokerWebuiBlocklyScriptEditor extends BaseCustomWebComponentConstructorAppend {
    static template = html `
        <div id="blocklyDiv" style="position: absolute; width: 100%; height: 100%;"></div>
    `;
    static style = css `
        :host {
            box-sizing: border-box;
            position: absolute;
            height: 100%;
            width: 100%;
        }`;
    static is = 'iobroker-webui-blockly-script-editor';
    blocklyDiv;
    workspace;
    static blocklyStyle1;
    static blocklyStyle2;
    resizeObserver;
    constructor() {
        super();
        super._restoreCachedInititalValues();
        this.blocklyDiv = this._getDomElement('blocklyDiv');
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
            IobrokerWebuiBlocklyScriptEditor.blocklyStyle1.replaceSync(document.getElementById('blockly-renderer-style-' + renderer + '-' + themename).innerText);
            IobrokerWebuiBlocklyScriptEditor.blocklyStyle2 = new CSSStyleSheet();
            //@ts-ignore
            IobrokerWebuiBlocklyScriptEditor.blocklyStyle2.replaceSync(document.getElementById('blockly-common-style').innerText);
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
            Blockly.svgResize(this.workspace);
        });
        this.resizeObserver.observe(this);
    }
    save() {
        //@ts-ignore
        const state = Blockly.serialization.workspaces.save(this.workspace);
        return state;
    }
    load(data) {
        //@ts-ignore
        Blockly.serialization.workspaces.load(data, this.workspace);
    }
    async test() {
        const fnc = await generateEventCodeFromBlockly(this.save());
        fnc({ a: 1 });
    }
}
customElements.define(IobrokerWebuiBlocklyScriptEditor.is, IobrokerWebuiBlocklyScriptEditor);
