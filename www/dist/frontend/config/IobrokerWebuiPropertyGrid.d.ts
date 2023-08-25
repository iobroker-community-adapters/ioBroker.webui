import { BaseCustomWebComponentConstructorAppend, TypedEvent } from "@node-projects/base-custom-webcomponent";
export interface ITypeInfo {
    properties?: IProperty[];
    name?: string;
}
export interface IProperty {
    category?: string;
    name?: string;
    type?: 'object' | 'string' | 'number' | 'boolean' | 'color' | 'enum';
    description?: string;
    defaultValue?: string;
    nullable?: boolean;
    format?: string;
}
export interface IFancyTreeItem {
    title?: string;
    icon?: string;
    folder?: boolean;
    expanded?: boolean;
    children?: IFancyTreeItem[];
    nodeType?: string;
    data?: any;
}
export declare function deepValue(obj: any, path: string, returnNullObject?: boolean): any;
export declare function setDeepValue(obj: any, path: string, value: any): void;
export declare class IobrokerWebuiPropertyGrid extends BaseCustomWebComponentConstructorAppend {
    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;
    static readonly properties: {
        noCategory: BooleanConstructor;
        hideProperties: StringConstructor;
        expanded: BooleanConstructor;
        selectedObject: ObjectConstructor;
        getTypeInfo: FunctionConstructor;
    };
    noCategory: boolean;
    hideProperties: string;
    expanded: boolean;
    getTypeInfo: (obj: any, type: string) => ITypeInfo;
    private _table;
    private _tree;
    private _head;
    constructor();
    ready(): void;
    private updateDescription;
    private _selectedObject;
    get selectedObject(): any;
    set selectedObject(value: any);
    propertyChanged: TypedEvent<{
        property: string;
        newValue: any;
    }>;
    typeName: string;
    private createPropertyNodes;
    private createPropertyNodesInternal;
    private _getEditorForType;
    private updateTree;
    private _renderTree;
    clear(): void;
}
