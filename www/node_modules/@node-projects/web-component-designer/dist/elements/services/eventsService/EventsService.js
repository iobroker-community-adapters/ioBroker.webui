export class EventsService {
    constructor() {
    }
    static _windowEvents = [
        { name: "afterprint", propertyName: "onafterprint", eventObjectName: "Event" },
        { name: "beforeprint", propertyName: "onbeforeprint", eventObjectName: "Event" },
        { name: "beforeunload", propertyName: "onbeforeunload", eventObjectName: "Event" },
        { name: "error", propertyName: "onerror", eventObjectName: "Event" },
        { name: "load", propertyName: "onload", eventObjectName: "Event" },
        { name: "hashchange", propertyName: "onhashchange", eventObjectName: "Event" },
        { name: "message", propertyName: "onmessage", eventObjectName: "Event" },
        { name: "offline", propertyName: "onoffline", eventObjectName: "Event" },
        { name: "online", propertyName: "ononline", eventObjectName: "Event" },
        { name: "pageshow", propertyName: "onpageshow", eventObjectName: "Event" },
        { name: "popstate", propertyName: "onpopstate", eventObjectName: "Event" },
        { name: "resize", propertyName: "onresize", eventObjectName: "Event" },
        { name: "storage", propertyName: "onstorage", eventObjectName: "Event" },
        { name: "unload", propertyName: "onunload", eventObjectName: "Event" }
    ];
    static _allElements = [
        { name: "contextmenu", propertyName: "oncontextmenu", eventObjectName: "PointerEvent" }
    ];
    static _focusableEvents = [
        { name: "blur", propertyName: "onblur", eventObjectName: "FocusEvent" },
        { name: "focus", propertyName: "onfocus", eventObjectName: "FocusEvent" },
        { name: "keydown", propertyName: "onkeydown", eventObjectName: "KeyboardEvent" },
        { name: "keyup", propertyName: "onkeyup", eventObjectName: "KeyboardEvent" }
    ];
    static _simpleForm = [
        { name: "input", propertyName: "oninput", eventObjectName: "InputEvent" },
        { name: "change", propertyName: "onchange", eventObjectName: "Event" }
    ];
    static _form = [
        { name: "beforeinput", propertyName: "onbeforeinput", eventObjectName: "InputEvent" },
        { name: "invalid", propertyName: "oninvalid", eventObjectName: "Event" },
        { name: "reset", propertyName: "onreset", eventObjectName: "Event" },
        { name: "select", propertyName: "onselect", eventObjectName: "Event" },
        { name: "submit", propertyName: "onsubmit", eventObjectName: "SubmitEvent" }
    ];
    static _simpleMouseEvents = [
        { name: "click", propertyName: "onclick", eventObjectName: "PointerEvent" },
        { name: "dblclick", propertyName: "ondblclick", eventObjectName: "MouseEvent" },
        { name: "wheel", propertyName: "onwheel", eventObjectName: "WheelEvent" },
        { name: "scroll", propertyName: "onscroll", eventObjectName: "Event" },
    ];
    static _mouseEvents = [
        { name: "mousedown", propertyName: "onmousedown", eventObjectName: "MouseEvent" },
        { name: "mouseup", propertyName: "onmouseup", eventObjectName: "MouseEvent" },
        { name: "mousemove", propertyName: "onmousemove", eventObjectName: "MouseEvent" },
        { name: "mouseover", propertyName: "onmouseover", eventObjectName: "MouseEvent" },
        { name: "mouseout", propertyName: "onmouseout", eventObjectName: "MouseEvent" }
    ];
    static _pointerEvents = [
        { name: "pointerdown", propertyName: "onpointerdown", eventObjectName: "PointerEvent" },
        { name: "pointerup", propertyName: "onpointerup", eventObjectName: "PointerEvent" },
        { name: "pointerenter", propertyName: "onpointerenter", eventObjectName: "PointerEvent" },
        { name: "pointerleave", propertyName: "onpointerleave", eventObjectName: "PointerEvent" },
        { name: "pointermove", propertyName: "onpointermove", eventObjectName: "PointerEvent" },
        { name: "pointerover", propertyName: "onpointerover", eventObjectName: "PointerEvent" },
        { name: "pointerout", propertyName: "onpointerout", eventObjectName: "PointerEvent" },
        { name: "pointercancel", propertyName: "onpointercancel", eventObjectName: "PointerEvent" }
    ];
    static _touchEvents = [
        { name: "touchstart", propertyName: "ontouchstart", eventObjectName: "TouchEvent" },
        { name: "touchend", propertyName: "ontouchend", eventObjectName: "TouchEvent" },
        { name: "touchmove", propertyName: "ontouchmove", eventObjectName: "TouchEvent" },
        { name: "touchcancel", propertyName: "ontouchcancel", eventObjectName: "TouchEvent" }
    ];
    static _dragEvents = [
        { name: "drag", propertyName: "ondrag", eventObjectName: "DragEvent" },
        { name: "dragend", propertyName: "ondragend", eventObjectName: "DragEvent" },
        { name: "dragenter", propertyName: "ondragenter", eventObjectName: "DragEvent" },
        { name: "dragleave", propertyName: "ondragleave", eventObjectName: "DragEvent" },
        { name: "dragover", propertyName: "ondragover", eventObjectName: "DragEvent" },
        { name: "dragstart", propertyName: "ondragstart", eventObjectName: "DragEvent" },
        { name: "drop", propertyName: "ondrop", eventObjectName: "DragEvent" }
    ];
    static _clipboard = [
        { name: "copy", propertyName: "oncopy", eventObjectName: "ClipboardEvent" },
        { name: "cut", propertyName: "oncut", eventObjectName: "ClipboardEvent" },
        { name: "paste", propertyName: "onpaste", eventObjectName: "ClipboardEvent" }
    ];
    static _details = [
        { name: "toggle", propertyName: "ontoggle", eventObjectName: "Event" }
    ];
    static _allEvents = [...EventsService._windowEvents, ...EventsService._form, ...EventsService._simpleMouseEvents, ...EventsService._mouseEvents, ...EventsService._pointerEvents, ...EventsService._touchEvents, ...EventsService._allElements, ...EventsService._focusableEvents, ...EventsService._dragEvents, ...EventsService._clipboard, ...EventsService._dragEvents];
    isHandledElementFromEventsService(designItem) {
        return true;
    }
    getPossibleEvents(designItem) {
        if (designItem.element instanceof designItem.window.HTMLInputElement ||
            designItem.element instanceof designItem.window.HTMLTextAreaElement ||
            designItem.element instanceof designItem.window.HTMLSelectElement) {
            let events = [...EventsService._simpleForm, ...EventsService._simpleMouseEvents, ...EventsService._form, ...EventsService._pointerEvents, ...EventsService._allElements, ...EventsService._focusableEvents];
            return events;
        }
        let events = [...EventsService._simpleMouseEvents, ...EventsService._pointerEvents, ...EventsService._allElements, ...EventsService._focusableEvents];
        return events;
    }
    getEvent(designItem, name) {
        let evt = EventsService._allEvents.find(x => x.name == name);
        return evt ?? { name, propertyName: 'on' + name, eventObjectName: 'Event' };
    }
}
//# sourceMappingURL=EventsService.js.map