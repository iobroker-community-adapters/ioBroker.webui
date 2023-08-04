import { IUiCommandHandler, ServiceContainer } from '@node-projects/web-component-designer';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager.js';
import { IobrokerWebuiAppShell } from './IobrokerWebuiAppShell.js';
export declare class CommandHandling {
    dockManager: DockManager;
    iobrokerWebuiAppShell: IobrokerWebuiAppShell;
    constructor(dockManager: DockManager, iobrokerWebuiAppShell: IobrokerWebuiAppShell, serviceContainer: ServiceContainer);
    handleCommandButtonClick(e: any): Promise<void>;
    handleInputValueChanged(e: any): void;
    init(serviceContainer: ServiceContainer): void;
    handleCommand(buttons: HTMLButtonElement[], target: IUiCommandHandler): void;
}
