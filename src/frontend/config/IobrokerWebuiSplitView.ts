//Parts from https://github.com/vaadin/vaadin-split-layout/blob/master/src/vaadin-split-layout.html
//Apache License: https://www.apache.org/licenses/LICENSE-2.0.html

import { BaseCustomWebComponentConstructorAppend, css, customElement, html, property } from "@node-projects/base-custom-webcomponent";

@customElement('iobroker-webui-split-view')
export class IobrokerWebuiSplitView extends BaseCustomWebComponentConstructorAppend {
    static readonly style = css`
        :host {
            display: flex;
            overflow: hidden !important;
            transform: translateZ(0);
        }

        :host([hidden]) {
            display: none !important;
        }

        :host([orientation="vertical"]) {
            flex-direction: column;
        }

        :host ::slotted(*) {
            flex: 1 1 auto;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        }

        [part="splitter"] {
            flex: none;
            position: relative;
            z-index: 1;
            overflow: visible;
            min-width: 8px;
            min-height: 8px;
        }

        :host(:not([orientation="vertical"])) > [part="splitter"] {
            cursor: ew-resize;
        }
        
        :host([orientation="vertical"]) > [part="splitter"] {
            cursor: ns-resize;
        }

        [part="handle"] {
            width: 40px;
            height: 40px;
            top: 50%;
            left: 50%;
            transform: translate3d(-50%, -50%, 0);
        }

        [part="splitter"] {
            min-width: 0.5rem;
            min-height: 0.5rem;
            background-color: hsla(214, 61%, 25%, 0.05);
            transition: 0.1s background-color;
        }

        [part="handle"] {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
        }

        [part="handle"]::after {
            content: "";
            display: block;
            width: 4px;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            border-radius: 0.25em;
            background-color: hsla(214, 47%, 21%, 0.38);
            transition: 0.1s opacity, 0.1s background-color;
        }

        :host([orientation="vertical"]) [part="handle"]::after {
            width: 100%;
            height: 4px;
        }

        [part="splitter"]:hover [part="handle"]::after {
            background-color: hsla(214, 47%, 21%, 0.38);
        }

        @media (pointer: coarse) {
            [part="splitter"]:hover [part="handle"]::after {
                background-color: hsla(214, 47%, 21%, 0.38);
            }
        }

        [part="splitter"]:active [part="handle"]::after {
            background-color: hsla(214, 45%, 20%, 0.5);
        }`;

    static readonly template = html`
        <slot id="primary" name="primary"></slot>
        <div part="splitter" id="splitter">
            <div part="handle"></div>
        </div>
        <slot id="secondary" name="secondary"></slot>`;

    @property(String)
    orientation: 'horizontal' | 'vertical' = 'horizontal';

    @property(Boolean)
    observe: false;

    private _observer: MutationObserver;
    private _primaryChild: HTMLElement;
    private _secondaryChild: HTMLElement;
    private _previousPrimaryPointerEvents: string;
    private _previousSecondaryPointerEvents: string;
    private _splitter: HTMLDivElement;
    private _startSize: { container: number; primary: any; secondary: any; };
    private _startX: number;
    private _startY: number;

    constructor() {
        super();
        this._splitter = this._getDomElement<HTMLDivElement>('splitter');
        this._splitter.onpointerdown = this._pointerDown.bind(this);
        this._splitter.onpointermove = this._pointerMove.bind(this);
        this._splitter.onpointerup = this._pointerUp.bind(this);

        this._parseAttributesToProperties();
    }

    ready() {
        if (this.observe) {
            this._observer = new MutationObserver(this._processChildren);
            this._observer.observe(this, { childList: true });
        }
        this._processChildren();
    }

    private _processChildren() {
        let i = 0;
        for (let c of this.children) {
            if (i === 0) {
                this._primaryChild = <HTMLElement>c;
                c.setAttribute('slot', 'primary');
            } else if (i == 1) {
                this._secondaryChild = <HTMLElement>c;
                c.setAttribute('slot', 'secondary');
            } else {
                c.removeAttribute('slot');
            }
            i++;
        }
    }

    private _setFlexBasis(element, flexBasis, containerSize) {
        flexBasis = Math.max(0, Math.min(flexBasis, containerSize));
        element.style.flex = '1 1 ' + flexBasis + 'px';
    }

    private _pointerDown(event: PointerEvent) {
        this._splitter.setPointerCapture(event.pointerId);
        this._startResize(event.x, event.y);
        event.preventDefault();
    }

    private _startResize(x: number, y: number) {
        if (!this._primaryChild || !this._secondaryChild) {
            return;
        }

        this._startX = x;
        this._startY = y;
        this._previousPrimaryPointerEvents = this._primaryChild.style.pointerEvents;
        this._previousSecondaryPointerEvents = this._secondaryChild.style.pointerEvents;
        this._primaryChild.style.pointerEvents = 'none';
        this._secondaryChild.style.pointerEvents = 'none';

        var size = this.orientation === 'vertical' ? 'height' : 'width';
        this._startSize = {
            container: this.getBoundingClientRect()[size] - this._splitter.getBoundingClientRect()[size],
            primary: this._primaryChild.getBoundingClientRect()[size],
            secondary: this._secondaryChild.getBoundingClientRect()[size]
        };
    }

    private _pointerUp(event: PointerEvent) {
        this._splitter.releasePointerCapture(event.pointerId);
        this._stopresize();
    }

    private _stopresize() {
        if (!this._primaryChild || !this._secondaryChild) {
            return;
        }
        this._primaryChild.style.pointerEvents = this._previousPrimaryPointerEvents;
        this._secondaryChild.style.pointerEvents = this._previousSecondaryPointerEvents;

        this._startSize = null;
    }

    private _pointerMove(event: PointerEvent) {
        this._onHandleMove(event.x, event.y);
    }

    private _onHandleMove(x: number, y: number) {
        if (!this._startSize) {
            return;
        }

        let dy = y - this._startY;
        let dx = x - this._startX;

        var distance = this.orientation === 'vertical' ? dy : dx;
        const isRtl = this.orientation !== 'vertical' && this.getAttribute('dir') === 'rtl';
        const dirDistance = isRtl ? -distance : distance;

        this._setFlexBasis(this._primaryChild, this._startSize.primary + dirDistance, this._startSize.container);
        this._setFlexBasis(this._secondaryChild, this._startSize.secondary - dirDistance, this._startSize.container);
    }
}