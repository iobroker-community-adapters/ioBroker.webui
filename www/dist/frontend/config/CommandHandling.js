import { ContextMenu } from '@node-projects/web-component-designer';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { IobrokerWebuiScreenEditor, defaultNewStyle } from './IobrokerWebuiScreenEditor.js';
export class CommandHandling {
    dockManager;
    iobrokerWebuiAppShell;
    constructor(dockManager, iobrokerWebuiAppShell, serviceContainer) {
        this.dockManager = dockManager;
        this.iobrokerWebuiAppShell = iobrokerWebuiAppShell;
        this.init(serviceContainer);
    }
    async handleCommandButtonClick(e) {
        let button = e.currentTarget;
        let commandName = button.dataset['command'];
        let commandParameter = button.dataset['commandParameter'];
        if (commandName === 'runtime') {
            let target = this.dockManager?.activeDocument?.resolvedElementContent;
            if (target instanceof IobrokerWebuiScreenEditor) {
                window.open("runtime.html#screenName=" + target.name);
            }
            else {
                window.open("runtime.html");
            }
        }
        else if (commandName === 'new') {
            let defaultName = '';
            if (!(await iobrokerHandler.getAllNames('screen')).includes('start'))
                defaultName = 'start';
            let screen = prompt("New Screen Name:", defaultName);
            let style = defaultNewStyle;
            if (screen) {
                let screentype = 'screen';
                if (commandParameter == 'grid') {
                    let columns = parseInt(prompt("No Columns:", "12"));
                    let rows = parseInt(prompt("No Rows:", "8"));
                    style += `\n\n:host {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: ${'1fr '.repeat(columns).trim()};
    grid-template-rows: ${'1fr '.repeat(rows).trim()};
    gap: 10px;
    padding: 10px;
}`;
                }
                if (commandParameter == 'control')
                    screentype = 'control';
                this.iobrokerWebuiAppShell.openScreenEditor(screen, screentype, '', style, null, {});
            }
        }
        else if (commandName === 'save') {
            let target = this.dockManager.activeDocument.resolvedElementContent;
            target.executeCommand({ type: commandName, parameter: commandParameter });
        }
        else if (this.dockManager.activeDocument) {
            let target = this.dockManager.activeDocument.resolvedElementContent;
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
            let target = this.dockManager.activeDocument.resolvedElementContent;
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
        });
        let undoButton = document.querySelector('[data-command="undo"]');
        let mouseDownTimer = null;
        undoButton.onmousedown = (e) => {
            mouseDownTimer = setTimeout(() => {
                let target = this.dockManager.activeDocument.resolvedElementContent;
                let entries = target.documentContainer.instanceServiceContainer.undoService.getUndoEntries(20);
                let mnu = Array.from(entries).map((x, idx) => ({ title: 'undo: ' + x, action: () => { for (let i = 0; i <= idx; i++)
                        target.documentContainer.instanceServiceContainer.undoService.undo(); } }));
                ContextMenu.show(mnu, e, { mode: 'undo' });
            }, 300);
        };
        undoButton.onmouseup = (e) => {
            if (mouseDownTimer) {
                clearTimeout(mouseDownTimer);
                mouseDownTimer = null;
            }
        };
        let redoButton = document.querySelector('[data-command="redo"]');
        redoButton.onmousedown = (e) => {
            mouseDownTimer = setTimeout(() => {
                let target = this.dockManager.activeDocument.resolvedElementContent;
                let entries = target.documentContainer.instanceServiceContainer.undoService.getRedoEntries(20);
                let mnu = Array.from(entries).map((x, idx) => ({ title: 'redo: ' + x, action: () => { for (let i = 0; i <= idx; i++)
                        target.documentContainer.instanceServiceContainer.undoService.redo(); } }));
                ContextMenu.show(mnu, e, { mode: 'undo' });
            }, 300);
        };
        redoButton.onmouseup = (e) => {
            if (mouseDownTimer) {
                clearTimeout(mouseDownTimer);
                mouseDownTimer = null;
            }
        };
        setInterval(() => {
            if (this.dockManager.activeDocument) {
                let target = this.dockManager.activeDocument.resolvedElementContent;
                if (target.canExecuteCommand) {
                    this.canExecuteCommand(buttons, target);
                }
                else {
                    this.canExecuteCommand(buttons, null);
                }
            }
            else {
                this.canExecuteCommand(buttons, null);
            }
        }, 100);
    }
    canExecuteCommand(buttons, target) {
        buttons.forEach(b => {
            let command = b.dataset['command'];
            let commandParameter = b.dataset['commandParameter'];
            if (command === 'new')
                b.disabled = false;
            else if (command === 'runtime')
                b.disabled = false;
            else
                b.disabled = !target ? true : !target.canExecuteCommand({ type: command, parameter: commandParameter });
        });
    }
}
