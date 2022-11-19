import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { ICommandHandler } from "@node-projects/web-component-designer";
import { CommandType } from "@node-projects/web-component-designer/dist/commandHandling/CommandType";
export declare class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend implements ICommandHandler {
    static template: HTMLTemplateElement;
    static style: CSSStyleSheet;
    executeCommand(type: CommandType, parameter: any): Promise<void>;
    canExecuteCommand(type: CommandType, parameter: any): boolean;
}
