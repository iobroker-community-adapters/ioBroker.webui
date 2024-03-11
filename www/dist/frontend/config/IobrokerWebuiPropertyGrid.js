import { VisualizationPropertyGrid } from "@node-projects/web-component-designer-visualization-addons";
export class IobrokerWebuiPropertyGrid extends VisualizationPropertyGrid {
    saveCallback;
    async executeCommand(command) {
        if (command.type == 'save') {
            this.saveCallback(this.selectedObject);
        }
    }
    canExecuteCommand(command) {
        if (command.type == 'save')
            return this.saveCallback != null;
        return false;
    }
}
customElements.define("iobroker-webui-property-grid", IobrokerWebuiPropertyGrid);
