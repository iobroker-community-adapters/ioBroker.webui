import { EventsService, IDesignItem, IEvent } from "@node-projects/web-component-designer";

export class IobrokerWebuiEventsService extends EventsService {
    override getPossibleEvents(designItem: IDesignItem): IEvent[] {
        let events = super.getPossibleEvents(designItem);
        let setEvents: IEvent[] = [];
        for (let a of designItem.attributes()) {
            if (a[0][0] == '@') {
                const evtName = a[0].substring(1);
                let idx = events.findIndex(x => x.name == evtName);
                if (idx >= 0) {
                    const e = events[idx];
                    events.splice(idx, 1);
                    setEvents.push(e);
                }
                else
                    setEvents.push({ name: evtName });
            }
        }
        return [...setEvents, ...events];
    }
}