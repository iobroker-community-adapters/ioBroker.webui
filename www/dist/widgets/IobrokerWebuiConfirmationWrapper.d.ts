import { BaseCustomWebComponentConstructorAppend, TypedEvent } from "@node-projects/base-custom-webcomponent";
export declare class IobrokerWebuiConfirmationWrapper extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    constructor();
    ready(): void;
    _ok(): void;
    _cancel(): void;
    okClicked: TypedEvent<void>;
    cancelClicked: TypedEvent<void>;
}
