import { DocumentContainer } from '@node-projects/web-component-designer';
import { IUiCommandHandler } from '@node-projects/web-component-designer/dist/commandHandling/IUiCommandHandler';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager';
import { AppShell } from './shell';
import Connection from '../SetupConnection';
import { screensPrefix } from '../Constants';
import { IBinding } from '../views/IBinding';
//Command Handling..
// Setup commands

export class CommandHandling {
  dockManager: DockManager;
  appShell: AppShell;

  constructor(dockManager: DockManager, appShell: AppShell) {
    this.dockManager = dockManager;
    this.appShell = appShell;
    this.init();
  }

  async handleCommandButtonClick(e) {
    const button = e.currentTarget;
    const commandName = button.dataset['command'];
    const commandParameter = button.dataset['commandParameter'];

    if (commandName === 'new')
      this.appShell.newDocument();
    else if (this.dockManager.activeDocument) {
      const target: any = (<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
      if (commandName == 'save') {
        const cont = target as DocumentContainer;
        const html = cont.content;
        const name = cont.title;
        const bindings: IBinding[] = [];
        await Connection.setObject(screensPrefix + name, {
          type: 'state', common: {
            name: name,
            type: 'string',
            role: 'state',
            read: false,
            write: false
          }, native: { html: html, bindings: JSON.stringify(bindings) }
        });
      }
      else
        if (target.executeCommand) {
          target.executeCommand({ type: commandName, parameter: commandParameter })
        }
    }
  }

  init() {
    let buttons = Array.from<HTMLButtonElement>(document.querySelectorAll('[data-command]'));
    buttons.forEach(b => {
      b.onclick = (e) => this.handleCommandButtonClick(e);
    });

    setInterval(() => {
      if (this.dockManager.activeDocument) {
        let target: any = (<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
        if (target.canExecuteCommand) {
          this.handleCommand(buttons, target);
        } else {
          this.handleCommand(buttons, null);
        }
      } else {
        this.handleCommand(buttons, null);
      }
    }, 100);
  }

  handleCommand(buttons: HTMLButtonElement[], target: IUiCommandHandler) {
    buttons.forEach(b => {
      let command = b.dataset['command'];
      if (command === 'new')
        b.disabled = false;
      else
        b.disabled = !target ? true : !target.canExecuteCommand({ type: <any>command });
    });
  }
}