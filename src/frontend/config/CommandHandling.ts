import { ContextMenu, IContextMenuItem, IUiCommandHandler, ServiceContainer } from '@node-projects/web-component-designer';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager.js'
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { IobrokerWebuiAppShell } from './IobrokerWebuiAppShell.js';
import { IobrokerWebuiScreenEditor } from './IobrokerWebuiScreenEditor.js';

export class CommandHandling {
  dockManager: DockManager;
  iobrokerWebuiAppShell: IobrokerWebuiAppShell;

  constructor(dockManager: DockManager, iobrokerWebuiAppShell: IobrokerWebuiAppShell, serviceContainer: ServiceContainer) {
    this.dockManager = dockManager;
    this.iobrokerWebuiAppShell = iobrokerWebuiAppShell;
    this.init(serviceContainer);
  }

  async handleCommandButtonClick(e) {
    let button = e.currentTarget;
    let commandName = button.dataset['command'];
    let commandParameter = button.dataset['commandParameter'];

    if (commandName === 'runtime') {
      let target: any = (<HTMLSlotElement><any>this.dockManager?.activeDocument?.elementContent)?.assignedElements()[0];
      if (target instanceof IobrokerWebuiScreenEditor) {
        window.open("runtime.html#screenName=" + target.name);
      }
      else {
        window.open("runtime.html");
      }

    } else if (commandName === 'new') {
      let defaultName = '';
      if (!(await iobrokerHandler.getScreenNames()).includes('start'))
        defaultName = 'start';
      let screen = prompt("New Screen Name:", defaultName);
      let style = `* {
    box-sizing: border-box;
}`;
      if (screen) {
        let screentype: 'screen' | 'control' = 'screen';
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
}`
        }
        if (commandParameter == 'control')
          screentype = 'control';
        this.iobrokerWebuiAppShell.openScreenEditor(screen, screentype, '', style, null, {});
      }
    }
    else if (commandName === 'save') {
      let target: any = (<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
      target.executeCommand({ type: <any>commandName, parameter: commandParameter })
    }
    else if (this.dockManager.activeDocument) {
      let target: any = (<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
      if (target.executeCommand) {
        target.executeCommand({ type: commandName, parameter: commandParameter })
      }
    }
  }

  handleInputValueChanged(e) {
    let input = e.currentTarget as HTMLInputElement;
    let commandName = input.dataset['command'];
    let commandParameter = input.value;

    if (this.dockManager.activeDocument) {
      let target: any = (<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
      if (target.executeCommand) {
        target.executeCommand({ type: commandName, parameter: commandParameter })
      }
    }
  }

  init(serviceContainer: ServiceContainer) {
    let buttons = Array.from<(HTMLButtonElement | HTMLInputElement)>(document.querySelectorAll('[data-command]'));
    buttons.forEach(b => {
      if (b instanceof HTMLButtonElement) {
        b.onclick = (e) => this.handleCommandButtonClick(e);
      } else {
        b.onchange = (e) => this.handleInputValueChanged(e);
        let commandName = b.dataset['command'];
        if (commandName == 'setStrokeColor')
          serviceContainer.globalContext.onStrokeColorChanged.on(e => b.value = e.newValue);
        if (commandName == 'setFillBrush')
          serviceContainer.globalContext.onFillBrushChanged.on(e => b.value = e.newValue);
      }
    });

    let undoButton = <HTMLButtonElement>document.querySelector('[data-command="undo"]')
    let mouseDownTimer = null;
    undoButton.onmousedown = (e) => {
      mouseDownTimer = setTimeout(() => {
        let target: IobrokerWebuiScreenEditor = <any>(<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
        let entries = target.documentContainer.instanceServiceContainer.undoService.getUndoEntries(20);
        let mnu: IContextMenuItem[] = Array.from(entries).map((x, idx) => ({ title: 'undo: ' + x, action: () => { for (let i = 0; i <= idx; i++) target.documentContainer.instanceServiceContainer.undoService.undo() } }));
        ContextMenu.show(mnu, e, { mode: 'undo' });
      }, 300)
    }
    undoButton.onmouseup = (e) => {
      if (mouseDownTimer) {
        clearTimeout(mouseDownTimer);
        mouseDownTimer = null;
      }
    }

    let redoButton = <HTMLButtonElement>document.querySelector('[data-command="redo"]')
    redoButton.onmousedown = (e) => {
      mouseDownTimer = setTimeout(() => {
        let target: IobrokerWebuiScreenEditor = <any>(<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
        let entries = target.documentContainer.instanceServiceContainer.undoService.getRedoEntries(20);
        let mnu: IContextMenuItem[] = Array.from(entries).map((x, idx) => ({ title: 'redo: ' + x, action: () => { for (let i = 0; i <= idx; i++) target.documentContainer.instanceServiceContainer.undoService.redo() } }));
        ContextMenu.show(mnu, e, { mode: 'undo' })
      }, 300)
    }
    redoButton.onmouseup = (e) => {
      if (mouseDownTimer) {
        clearTimeout(mouseDownTimer);
        mouseDownTimer = null;
      }
    }

    setInterval(() => {
      if (this.dockManager.activeDocument) {
        let target: any = (<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
        if (target.canExecuteCommand) {
          this.canExecuteCommand(buttons, target);
        } else {
          this.canExecuteCommand(buttons, null);
        }
      } else {
        this.canExecuteCommand(buttons, null);
      }
    }, 100);
  }

  canExecuteCommand(buttons: (HTMLElement & { disabled: boolean })[], target: IUiCommandHandler) {
    buttons.forEach(b => {
      let command = b.dataset['command'];
      let commandParameter = b.dataset['commandParameter'];
      if (command === 'new')
        b.disabled = false;
      else if (command === 'runtime')
        b.disabled = false;
      else
        b.disabled = !target ? true : !target.canExecuteCommand({ type: <any>command, parameter: commandParameter });
    });
  }
}