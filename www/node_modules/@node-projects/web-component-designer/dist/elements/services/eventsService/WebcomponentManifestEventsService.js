import { EventsService } from "./EventsService.js";
export class WebcomponentManifestEventsService extends EventsService {
    isHandledElementFromEventsService(designItem) {
        return this.__eventsList?.[designItem.name] != null;
    }
    getPossibleEvents(designItem) {
        return [...this.__eventsList[designItem.name], ...EventsService._simpleMouseEvents, ...EventsService._pointerEvents, ...EventsService._allElements, ...EventsService._focusableEvents];
    }
    getEvent(designItem, name) {
        let evt = this.getPossibleEvents(designItem).find(x => x.name == name);
        return evt ?? { name, propertyName: 'on' + name, eventObjectName: 'Event' };
    }
    __eventsList;
    constructor(name, manifest) {
        super();
        this._parseManifest(manifest);
    }
    _parseManifest(manifest) {
        this.__eventsList = {};
        let declarations = [];
        for (let m of manifest.modules) {
            if (m.declarations)
                declarations.push(...m.declarations);
        }
        for (let m of manifest.modules) {
            for (let e of m.exports) {
                if (e.kind == 'custom-element-definition') {
                    let declaration = declarations.find(x => x.name == e.declaration.name);
                    if (declaration) {
                        if (declaration.events) {
                            let events = [];
                            for (let e of declaration.events) {
                                events.push({ name: e.name });
                            }
                            if (events.length)
                                this.__eventsList[e.name] = events;
                        }
                    }
                    else {
                        console.warn('declaration for ' + e.declaration.name + ' not found', manifest);
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=WebcomponentManifestEventsService.js.map