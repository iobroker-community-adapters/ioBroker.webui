import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    static style: CSSStyleSheet;
    private _iobBindings;
    private _loading;
    _screenName: string;
    get screenName(): string;
    set screenName(value: string);
    _relativeSignalsPath: string;
    get relativeSignalsPath(): string;
    set relativeSignalsPath(value: string);
    objects: any;
    constructor();
    ready(): void;
    removeBindings(): void;
    private _loadScreen;
    loadScreenData(html: any, style: any): void;
    static assignAllScripts(shadowRoot: ShadowRoot, instance: HTMLElement): Promise<void>;
}
