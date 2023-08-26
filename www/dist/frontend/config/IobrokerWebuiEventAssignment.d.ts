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
    _getEventColor(eventItem: IEvent): "purple" | "lightgreen" | "white";
    _getEventType(eventItem: IEvent): 'js' | 'script' | 'none';
    _getEventMethodname(eventItem: IEvent): string;
    _inputMthName(event: InputEvent, eventItem: IEvent): void;
    _ctxMenu(e: MouseEvent, eventItem: IEvent): void;
    _addEvent(e: KeyboardEvent): Promise<void>;
    _contextMenuAddEvent(event: any, eventItem: IEvent): Promise<void>;
    _editEvent(e: MouseEvent, eventItem: IEvent): Promise<void>;
    refresh(): void;
    get selectedItems(): IDesignItem[];
    set selectedItems(items: IDesignItem[]);
}
