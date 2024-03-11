var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseCustomWebComponentConstructorAppend, css, customElement, html, property } from "@node-projects/base-custom-webcomponent";
let SplitView = class SplitView extends BaseCustomWebComponentConstructorAppend {
    static style = css `
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
    static template = html `
        <slot id="primary" name="primary"></slot>
        <div part="splitter" id="splitter">
            <div part="handle"></div>
        </div>
        <slot id="secondary" name="secondary"></slot>`;
    orientation = 'horizontal';
    observe;
    _observer;
    _primaryChild;
    _secondaryChild;
    _splitter;
    _startSize;
    _startX;
    _startY;
    constructor() {
        super();
        this._splitter = this._getDomElement('splitter');
        this._splitter.onpointerdown = this._pointerDown.bind(this);
        this._splitter.onpointermove = this._pointerMove.bind(this);
        this._splitter.onpointerup = this._pointerUp.bind(this);
        this._parseAttributesToProperties();
    }
    ready() {
        if (this.observe) {
            this._observer = new MutationObserver(this._assignSlots);
            this._observer.observe(this, { childList: true });
        }
        this._assignSlots();
    }
    _assignSlots() {
        let i = 0;
        for (const c of this.children) {
            if (i === 0) {
                this._primaryChild = c;
                c.setAttribute('slot', 'primary');
            }
            else if (i == 1) {
                this._secondaryChild = c;
                c.setAttribute('slot', 'secondary');
            }
            else {
                c.removeAttribute('slot');
            }
            i++;
        }
    }
    _setFlexBasis(element, flexBasis, containerSize) {
        flexBasis = Math.max(0, Math.min(flexBasis, containerSize));
        element.style.flex = '1 1 ' + flexBasis + 'px';
    }
    _pointerDown(event) {
        this._splitter.setPointerCapture(event.pointerId);
        this._startResize(event.x, event.y);
        event.preventDefault();
    }
    _startResize(x, y) {
        if (!this._primaryChild || !this._secondaryChild) {
            return;
        }
        this._startX = x;
        this._startY = y;
        var size = this.orientation === 'vertical' ? 'height' : 'width';
        this._startSize = {
            container: this.getBoundingClientRect()[size] - this._splitter.getBoundingClientRect()[size],
            primary: this._primaryChild.getBoundingClientRect()[size],
            secondary: this._secondaryChild.getBoundingClientRect()[size]
        };
    }
    _pointerUp(event) {
        this._splitter.releasePointerCapture(event.pointerId);
        this._stopresize();
    }
    _stopresize() {
        if (!this._primaryChild || !this._secondaryChild) {
            return;
        }
        this._startSize = null;
    }
    _pointerMove(event) {
        this._onHandleMove(event.x, event.y);
    }
    _onHandleMove(x, y) {
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
};
__decorate([
    property(String)
], SplitView.prototype, "orientation", void 0);
__decorate([
    property(Boolean)
], SplitView.prototype, "observe", void 0);
SplitView = __decorate([
    customElement('node-projects-split-view')
], SplitView);
export { SplitView };
