import { ServiceContainer } from '@node-projects/web-component-designer';
import { IUiCommandHandler } from '@node-projects/web-component-designer/dist/commandHandling/IUiCommandHandler';
import { DockManager } from 'dock-spawn-ts/lib/js/DockManager';
import { IobrokerWebuiAppShell } from './IobrokerWebuiAppShell';
export declare class CommandHandling {
    dockManager: DockManager;
    iobrokerWebuiAppShell: IobrokerWebuiAppShell;
    constructor(dockManager: DockManager, iobrokerWebuiAppShell: IobrokerWebuiAppShell, serviceContainer: ServiceContainer);
    handleCommandButtonClick(e: any): Promise<void>;
    handleInputValueChanged(e: any): void;
    init(serviceContainer: ServiceContainer): void;
    handleCommand(buttons: HTMLButtonElement[], target: IUiCommandHandler): void;
}
