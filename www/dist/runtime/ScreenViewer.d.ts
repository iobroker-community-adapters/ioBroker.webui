import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    private _iobBindings;
    _screenName: string;
    get screenName(): string;
    set screenName(value: string);
    _relativeStatesPath: string;
    get relativeStatesPath(): string;
    set relativeStatesPath(value: string);
    objects: any;
    constructor();
    ready(): void;
    private _loadScreen;
    loadScreenData(html: any): void;
}
