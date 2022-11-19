import { BaseCustomWebComponentConstructorAppend, TypedEvent } from "@node-projects/base-custom-webcomponent";
export declare function getDeepValue(obj: any, path: string): any;
export declare function setDeepValue(obj: any, path: string, value: any): void;
export interface IPropertyInfo {
    name: string;
    type: string;
    nullable: boolean;
    category?: string;
    description?: string;
}
export interface IPropertyProvider {
    getProperties(typeName: string, instance: any): Record<string, IPropertyInfo>;
}
export declare class PropertyGrid extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    static readonly properties: {
        noCategory: BooleanConstructor;
        hideProperties: StringConstructor;
        expanded: BooleanConstructor;
    };
    static readonly is = "property-grid";
    propertyProvider: IPropertyProvider;
    typeName: string;
    noCategory: boolean;
    hideProperties: string;
    expanded: boolean;
    getSpecialPropertyEditor: (property: IPropertyInfo, currentValue: any, propertyPath: string, valueChangedCallback: (newValue: any) => void) => HTMLElement;
    private _selectedObject;
    get selectedObject(): any;
    set selectedObject(value: any);
    propertyChanged: TypedEvent<{
        property: string;
        newValue: any;
    }>;
    private _table;
    private _tree;
    private _head;
    constructor();
    ready(): void;
    private updateDescription;
    private createPropertyNodes;
    private createPropertyNodesInternal;
    wrapEditorWithNullable(inner: HTMLElement, currentValue: any, propertyPath: string): HTMLElement;
    private _internalGetEditorForType;
    private getEditorForType;
    private updateTree;
    private _renderTree;
    clear(): void;
}
