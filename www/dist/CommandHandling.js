import { iobrokerHandler } from './IobrokerHandler.js';
export class CommandHandling {
    constructor(dockManager, iobrokerWebuiAppShell, serviceContainer) {
        this.dockManager = dockManager;
        this.iobrokerWebuiAppShell = iobrokerWebuiAppShell;
        this.init(serviceContainer);
    }
    async handleCommandButtonClick(e) {
        let button = e.currentTarget;
        let commandName = button.dataset['command'];
        let commandParameter = button.dataset['commandParameter'];
        if (commandName === 'new') {
            let screen = prompt("New Screen Name:");
            if (screen)
                this.iobrokerWebuiAppShell.newDocument(screen, null);
        }
        else if (commandName === 'save') {
            let target = this.dockManager.activeDocument.elementContent.assignedElements()[0];
            let html = target.designerView.getHTML();
            let screen = { html, styles: null, settings: {} };
            await iobrokerHandler.saveScreen(target.title, screen);
        }
        else if (this.dockManager.activeDocument) {
            let target = this.dockManager.activeDocument.elementContent.assignedElements()[0];
            if (target.executeCommand) {
                target.executeCommand({ type: commandName, parameter: commandParameter });
            }
        }
    }
    handleInputValueChanged(e) {
        let input = e.currentTarget;
        let commandName = input.dataset['command'];
        let commandParameter = input.value;
        if (this.dockManager.activeDocument) {
            let target = this.dockManager.activeDocument.elementContent.assignedElements()[0];
            if (target.executeCommand) {
                target.executeCommand({ type: commandName, parameter: commandParameter });
            }
        }
    }
    init(serviceContainer) {
        let buttons = Array.from(document.querySelectorAll('[data-command]'));
        buttons.forEach(b => {
            if (b instanceof HTMLButtonElement) {
                b.onclick = (e) => this.handleCommandButtonClick(e);
            }
            else {
                b.onchange = (e) => this.handleInputValueChanged(e);
                let commandName = b.dataset['command'];
                if (commandName == 'setStrokeColor')
                    serviceContainer.globalContext.onStrokeColorChanged.on(e => b.value = e.newValue);
                if (commandName == 'setFillBrush')
                    serviceContainer.globalContext.onFillBrushChanged.on(e => b.value = e.newValue);
            }
        });
        setInterval(() => {
            if (this.dockManager.activeDocument) {
                let target = this.dockManager.activeDocument.elementContent.assignedElements()[0];
                if (target.canExecuteCommand) {
                    this.handleCommand(buttons, target);
                }
                else {
                    this.handleCommand(buttons, null);
                }
            }
            else {
                this.handleCommand(buttons, null);
            }
        }, 100);
    }
    handleCommand(buttons, target) {
        buttons.forEach(b => {
            let command = b.dataset['command'];
            let commandParameter = b.dataset['commandParameter'];
            if (command === 'new')
                b.disabled = false;
            else
                b.disabled = !target ? true : !target.canExecuteCommand({ type: command, parameter: commandParameter });
        });
    }
}
