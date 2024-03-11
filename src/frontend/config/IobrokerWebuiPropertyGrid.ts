import { IUiCommand } from "@node-projects/web-component-designer";
import { VisualizationPropertyGrid } from "@node-projects/web-component-designer-visualization-addons";

export class IobrokerWebuiPropertyGrid extends VisualizationPropertyGrid {
    saveCallback: (data: any) => void;
    async executeCommand(command: Omit<IUiCommand, 'type'> & { type: string }) {
        if (command.type == 'save') {
            this.saveCallback(this.selectedObject)
        }
    }

    canExecuteCommand(command: Omit<IUiCommand, 'type'> & { type: string }): boolean {
        if (command.type == 'save')
            return this.saveCallback != null;
        return false;
    }
}
customElements.define("iobroker-webui-property-grid", IobrokerWebuiPropertyGrid);