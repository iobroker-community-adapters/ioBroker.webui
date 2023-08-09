import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent"
import { IUiCommand, IUiCommandHandler,  } from "@node-projects/web-component-designer"

export class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler  {
    
    public static override template = html``
    
    public static override style = css``
    
    executeCommand: (command: IUiCommand) => void
    canExecuteCommand: (command: IUiCommand) => boolean
    
}