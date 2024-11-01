import { EventsService, IDesignItem, IEvent, IEventsService, PropertiesHelper } from "@node-projects/web-component-designer";
import { BaseCustomControl, CustomControlInfo, webuiCustomControlSymbol } from "../runtime/CustomControls.js";
import { IControl } from "../interfaces/IControl.js";

export class IobrokerWebuiCustomControlEventsService implements IEventsService {
    public isHandledElementFromEventsService(designItem: IDesignItem): boolean {
        return designItem.element instanceof BaseCustomControl;
    }

    public getPossibleEvents(designItem: IDesignItem): IEvent[] {
        const evt: IEvent[] = [];
        let control: IControl = (<CustomControlInfo>(<any>designItem.element.constructor)[webuiCustomControlSymbol]).control;
        for (const pname in control.properties) {
            if (control.properties[pname].internal)
                continue;
            evt.push({ name: PropertiesHelper.camelToDashCase(pname) + '-changed' })
        }
        return [...evt, ...EventsService._simpleMouseEvents, ...EventsService._pointerEvents, ...EventsService._allElements, ...EventsService._focusableEvents];
    }

    public getEvent(designItem: IDesignItem, name: string): IEvent {
        let evt = this.getPossibleEvents(designItem).find(x => x.name == name);
        return evt ?? { name, propertyName: 'on' + name, eventObjectName: 'Event' };
    }
}