import { BaseCustomWebComponentConstructorAppend, css, html, property } from "@node-projects/base-custom-webcomponent";

export class ComboBox extends BaseCustomWebComponentConstructorAppend {
    public static readonly style = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }
        select {
            height: 100%;
            width: 100%;
        }
    `;

    public static readonly template = html`
        <select id="select"></select>
    `;

    public static readonly is = 'iobroker-webui-svg-image';
    
    //@ts-ignore
    private _select: HTMLSelectElement;

    constructor() {
        super();
        this._select = this._getDomElement<HTMLSelectElement>('select');
        this._parseAttributesToProperties();
    }

    private _items: string;
    @property(String)
    public get items() {
        return this._items;
    }

    public set items(value: string) {
        this._items = value;
    }
}

customElements.define(ComboBox.is, ComboBox);