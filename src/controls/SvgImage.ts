import { BaseCustomWebComponentConstructorAppend, css, customElement, html, property } from "@node-projects/base-custom-webcomponent";

@customElement(SvgImage.is)
export class SvgImage extends BaseCustomWebComponentConstructorAppend {
    public static readonly style = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
            fill: var(--primary-color, white);
            stroke: var(--primary-color, white);
            color: white;
            font-familiy: Roboto;
            font-size: 14px;
        }
        #container {
            display: flex;
            flex-direction: column;
            justify-items: center;
            justify-content: center;
            align-items: center;
            height: 100%;
            width: 100%;
            overflow: hidden;
        }
        #main {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        svg {
            height: 32px;
            width: 32px;
        }
        #foot {
            color: var(--primary-color, white);
            overflow: hidden;
        }
    `;

    public static readonly template = html`
    <div id="container">
        <div id="head"></div>
        <div id="main"></div>
        <div id="foot"></div>
        </div>
    `

    public static readonly is = 'iobroker-webui-svg-image';

    private _head: HTMLDivElement;
    private _main: HTMLDivElement;
    private _foot: HTMLDivElement;

    constructor() {
        super();
        this._restoreCachedInititalValues();

        this._head = this._getDomElement<HTMLDivElement>('head');
        this._main = this._getDomElement<HTMLDivElement>('main');
        this._foot = this._getDomElement<HTMLDivElement>('foot');
    }

    ready() {
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
            this._main.innerHTML = await x.text();
        })
    }

    private _bgImageSrc: string;
    @property(String)
    public get bgImageSrc() {
        return this._bgImageSrc;
    }
    public set bgImageSrc(value: string) {
        this._bgImageSrc = value;
        fetch(value).then(async x => {
            //this._main.innerHTML = await x.text();
        });
    }

    private _value: string;
    @property(String)
    public get value() {
        return this._value;
    }
    public set value(value: string) {
        this._value = value;
        this._foot.innerText = value ?? '';
    }

    private _name: string;
    @property(String)
    public get name() {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
        this._head.innerText = value ?? '';
    }
}