import { DocumentContainer, ServiceContainer } from '@node-projects/web-component-designer';
import { IUiCommandHandler } from '@node-projects/web-component-designer/dist/commandHandling/IUiCommandHandler';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager';
import { iobrokerHandler } from './IobrokerHandler';
import { IobrokerWebuiAppShell } from './IobrokerWebuiAppShell';

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

    if (commandName === 'new') {
      let screen = prompt("New Screen Name:");
      if (screen)
        this.iobrokerWebuiAppShell.newDocument(screen, null);
    }
    else if (commandName === 'save') {
      let target: any = (<HTMLSlotElement><any>this.dockManager.activeDocument.elementContent).assignedElements()[0];
      let html = (<DocumentContainer>target).designerView.getHTML();
      await iobrokerHandler.saveScreen(target.title, html);
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
      let commandParameter = b.dataset['commandParameter'];
      if (command === 'new')
        b.disabled = false;
      else
        b.disabled = !target ? true : !target.canExecuteCommand({ type: <any>command, parameter: commandParameter });
    });
  }
}