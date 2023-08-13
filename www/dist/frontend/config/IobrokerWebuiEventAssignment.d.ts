import { BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent";
import { IDesignItem, IEvent, InstanceServiceContainer } from "@node-projects/web-component-designer";
export declare class IobrokerWebuiEventAssignment extends BaseCustomWebComponentConstructorAppend {
    static style: CSSStyleSheet;
    static template: HTMLTemplateElement;
    constructor();
    ready(): void;
    private _instanceServiceContainer;
    private _selectionChangedHandler;
    private _selectedItems;
    events: IEvent[];
    set instanceServiceContainer(value: InstanceServiceContainer);
    _isEventSet(eventItem: IEvent): "lightgreen" | "white";
    _ctxMenu(e: MouseEvent, eventItem: IEvent): void;
    _editEvent(e: MouseEvent, eventItem: IEvent): void;
    get selectedItems(): IDesignItem[];
    set selectedItems(items: IDesignItem[]);
}
