import { IUiCommandHandler, ServiceContainer } from '@node-projects/web-component-designer';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager.js'
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { IobrokerWebuiAppShell } from './IobrokerWebuiAppShell.js';
import { IobrokerWebuiScreenEditor, defaultNewStyle } from './IobrokerWebuiScreenEditor.js';

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
      let target: any = this.dockManager?.activeDocument?.resolvedElementContent;
      if (target instanceof IobrokerWebuiScreenEditor) {
        window.open("runtime.html#screenName=" + target.name);
      }
      else {
        window.open("runtime.html");
      }

    } else if (commandName === 'new') {
      let defaultName = '';
      if (!(await iobrokerHandler.getAllNames('screen')).includes('start'))
        defaultName = 'start';
      let screen = prompt("New Screen Name:", defaultName);
      let style = defaultNewStyle;
      if (screen) {
        let screentype: 'screen' | 'control' = 'screen';
        if (commandParameter == 'grid') {
          let columns = parseInt(prompt("No Columns:", "12"));
          let rows = parseInt(prompt("No Rows:", "8"));
          style += `\n\n:host {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(${columns}, 1fr);
    grid-template-rows: repeat(${rows}, 1fr);
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
      let target: any = this.dockManager.activeDocument.resolvedElementContent;
      target.executeCommand({ type: <any>commandName, parameter: commandParameter })
    }
    else if (this.dockManager.activeDocument) {
      let target: any = this.dockManager.activeDocument.resolvedElementContent;
      if (target.executeCommand) {
        target.executeCommand({ type: commandName, parameter: commandParameter })
      }
    }
  }

  handleCommandButtonMouseHold(button, e) {
    let commandName = <string>button.dataset['command'];
    let commandParameter = button.dataset['commandParameter'];
    let target: any = this.dockManager.activeDocument.resolvedElementContent;
    target.executeCommand({ type: <any>('hold' + commandName[0].toUpperCase() + commandName.substring(1)), parameter: commandParameter, event: e });
  }

  handleInputValueChanged(e) {
    let input = e.currentTarget as HTMLInputElement;
    let commandName = input.dataset['command'];
    let commandParameter = input.value;

    if (this.dockManager.activeDocument) {
      let target: any = this.dockManager.activeDocument.resolvedElementContent;
      if (target.executeCommand) {
        target.executeCommand({ type: commandName, parameter: commandParameter })
      }
    }
  }

  init(serviceContainer: ServiceContainer) {
    let buttons = Array.from<(HTMLButtonElement | HTMLInputElement)>(document.querySelectorAll('[data-command]'));
    buttons.forEach(b => {
      let mouseDownTimer = null;
      b.addEventListener('mousedown', (e) => {
        mouseDownTimer = setTimeout(() => {
          this.handleCommandButtonMouseHold(b, e);
          mouseDownTimer = false;
        }, 300);
      });
      b.addEventListener('click', (e) => {
        if (mouseDownTimer !== false)
          this.handleCommandButtonClick(e);
      });
      b.addEventListener('mouseup', (e) => {
        if (mouseDownTimer) {
          clearTimeout(mouseDownTimer);
          mouseDownTimer = null;
        }
      });
    });

    setInterval(() => {
      if (this.dockManager.activeDocument) {
        let target: any = this.dockManager.activeDocument?.resolvedElementContent;
        if (target.canExecuteCommand) {
          this.canExecuteCommand(buttons, target);
        } else {
          this.canExecuteCommand(buttons, null);
        }
      } else {
        this.canExecuteCommand(buttons, null);
      }
      const target: IobrokerWebuiScreenEditor = <IobrokerWebuiScreenEditor>this.dockManager.activeDocument?.resolvedElementContent;
      if (target) {
        const undoCount = target.documentContainer.instanceServiceContainer.undoService.undoCount;
        const redoCount = target.documentContainer.instanceServiceContainer.undoService.redoCount;
        document.getElementById('undoCount').innerText = '(' + undoCount + '/' + (undoCount + redoCount) + ')';
        document.getElementById('redoCount').innerText = '(' + redoCount + '/' + (undoCount + redoCount) + ')';
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