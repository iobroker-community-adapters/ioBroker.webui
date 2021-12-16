/// <reference types="iobroker" />
import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
export declare class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    _states: {
        [name: string]: any;
    };
    _subscriptions: Set<string>;
    _screenName: string;
    get screenName(): string;
    set screenName(value: string);
    objects: any;
    constructor();
    ready(): void;
    private _loadScreen;
    state(name: string): any;
    set(name: string, value: ioBroker.StateValue): void;
}
