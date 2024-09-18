import { EventsService, PropertiesHelper } from "@node-projects/web-component-designer";
import { BaseCustomControl, webuiCustomControlSymbol } from "../runtime/CustomControls.js";
export class IobrokerWebuiCustomControlEventsService {
    isHandledElementFromEventsService(designItem) {
        return designItem.element instanceof BaseCustomControl;
    }
    getPossibleEvents(designItem) {
        const evt = [];
        let control = designItem.element.constructor[webuiCustomControlSymbol].control;
        for (const pname in control.properties) {
            evt.push({ name: PropertiesHelper.camelToDashCase(pname) + '-changed' });
        }
        return [...evt, ...EventsService._simpleMouseEvents, ...EventsService._pointerEvents, ...EventsService._allElements, ...EventsService._focusableEvents];
    }
    getEvent(designItem, name) {
        let evt = this.getPossibleEvents(designItem).find(x => x.name == name);
        return evt ?? { name, propertyName: 'on' + name, eventObjectName: 'Event' };
    }
}
