import { IDesignItem, IEvent, IEventsService } from "@node-projects/web-component-designer";

export class IobrokerWebuiEventsService implements IEventsService {
    public isHandledElementFromEventsService(designItem: IDesignItem): boolean {
        return true;
    }

    public getPossibleEvents(designItem: IDesignItem): IEvent[] {
        let srv = designItem.serviceContainer.getLastServiceWhere('eventsService', x => !(x instanceof IobrokerWebuiEventsService) && x.isHandledElementFromEventsService(designItem));
        let events = srv.getPossibleEvents(designItem);
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

    public getEvent(designItem: IDesignItem, name: string): IEvent {
        let evt = this.getPossibleEvents(designItem).find(x => x.name == name);
        return evt ?? { name, propertyName: 'on' + name, eventObjectName: 'Event' };
    }
}