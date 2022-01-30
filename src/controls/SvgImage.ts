import { BaseCustomWebComponentConstructorAppend, css, customElement, property } from "@node-projects/base-custom-webcomponent";

export class SvgImage extends BaseCustomWebComponentConstructorAppend {
    public static readonly style = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
            fill: black;
            stroke: black;
        }
        svg {
            height: 100%;
            width: 100%;
        }
    `;

    public static readonly is = 'iobroker-webui-svg-image';

    constructor() {
        super();
        this._parseAttributesToProperties();
    }

    private _src: string;
    @property(String)
    public get src() {
        return this._src;
    }

    public set src(value: string) {
        this._src = value;
        fetch(value).then(async x => {
            this.shadowRoot.innerHTML = await x.text();
        })
    }
}

customElements.define(SvgImage.is, SvgImage);