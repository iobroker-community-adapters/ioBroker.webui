export class IobrokerWebuiEventsService {
    isHandledElementFromEventsService(designItem) {
        return true;
    }
    getPossibleEvents(designItem) {
        let srv = designItem.serviceContainer.getLastServiceWhere('eventsService', x => !(x instanceof IobrokerWebuiEventsService) && x.isHandledElementFromEventsService(designItem));
        let events = srv.getPossibleEvents(designItem);
        let setEvents = [];
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
    getEvent(designItem, name) {
        let evt = this.getPossibleEvents(designItem).find(x => x.name == name);
        return evt ?? { name, propertyName: 'on' + name, eventObjectName: 'Event' };
    }
}
