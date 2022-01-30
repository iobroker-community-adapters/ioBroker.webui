import { JSONSchema7 } from "json-schema";
import { IPropertyInfo, IPropertyProvider } from "./PropertyGrid.js";
export declare class TypeScriptJsonSchemaPropertiesProvider implements IPropertyProvider {
    schema: JSONSchema7;
    constructor(schema: JSONSchema7);
    getProperties(typeName: string, instance: any): Record<string, IPropertyInfo>;
}
