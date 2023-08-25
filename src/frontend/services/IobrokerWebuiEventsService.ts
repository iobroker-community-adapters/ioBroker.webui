import { EventsService, IDesignItem, IEvent } from "@node-projects/web-component-designer";

export class IobrokerWebuiEventsService extends EventsService {
    override getPossibleEvents(designItem: IDesignItem): IEvent[] {

        let events = super.getPossibleEvents(designItem);
        let setEvents: IEvent[] = [];
        for  (let a of designItem.attributes()) {
setEvents.push({name:a[0],propertyName:a[0]});
        }

        //Todo: create corret events list for all std. elements
        let lst = [...this._mouseEvents, ...this._allElements, ...this._focusableEvents];
        let events: IEvent[] = lst.map(x => ({ name: x, propertyName: 'on' + x }));
        return events;
    }
}