import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent"
import { ICommandHandler } from "@node-projects/web-component-designer"
import { CommandType } from "@node-projects/web-component-designer/dist/commandHandling/CommandType"

export class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend implements ICommandHandler  {
    
    public static override template = html``

    public static override style = css``

    executeCommand(type: CommandType, parameter: any): Promise<void> {
        throw new Error("Method not implemented.")
    }
    canExecuteCommand(type: CommandType, parameter: any): boolean {
        throw new Error("Method not implemented.")
    }
}