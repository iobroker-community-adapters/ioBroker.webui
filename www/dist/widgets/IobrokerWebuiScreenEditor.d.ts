import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { DocumentContainer, IUiCommand, IUiCommandHandler, ServiceContainer } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler {
    private _name;
    private _configChangedListener;
    documentContainer: DocumentContainer;
    static template: HTMLTemplateElement;
    static style: CSSStyleSheet;
    initialize(name: string, html: string, style: string, serviceContainer: ServiceContainer): Promise<void>;
    executeCommand(command: IUiCommand): Promise<void>;
    canExecuteCommand(command: IUiCommand): boolean;
    activated(): void;
    dispose(): void;
}
