import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { CommandType, ICommandHandler } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend implements ICommandHandler {
    static template: HTMLTemplateElement;
    static style: CSSStyleSheet;
    executeCommand(type: CommandType, parameter: any): Promise<void>;
    canExecuteCommand(type: CommandType, parameter: any): boolean;
}
