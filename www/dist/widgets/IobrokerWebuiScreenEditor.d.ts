import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { IUiCommand, IUiCommandHandler } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler {
    static template: HTMLTemplateElement;
    static style: CSSStyleSheet;
    executeCommand: (command: IUiCommand) => void;
    canExecuteCommand: (command: IUiCommand) => boolean;
}
