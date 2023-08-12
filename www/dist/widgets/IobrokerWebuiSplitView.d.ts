import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class IobrokerWebuiSplitView extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    orientation: 'horizontal' | 'vertical';
    observe: false;
    private _observer;
    private _primaryChild;
    private _secondaryChild;
    private _previousPrimaryPointerEvents;
    private _previousSecondaryPointerEvents;
    private _splitter;
    private _startSize;
    private _startX;
    private _startY;
    constructor();
    ready(): void;
    private _processChildren;
    private _setFlexBasis;
    private _pointerDown;
    private _startResize;
    private _pointerUp;
    private _stopresize;
    private _pointerMove;
    private _onHandleMove;
}
