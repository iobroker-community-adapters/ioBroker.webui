import { JSONSchema7 } from "json-schema";
import { IPropertyInfo, IPropertyProvider } from "./PropertyGrid.js";

export class TypeScriptJsonSchemaPropertiesProvider implements IPropertyProvider {
    schema: JSONSchema7

    constructor(schema: JSONSchema7) {
        this.schema = schema;
    }

    getProperties(typeName: string, instance: any): Record<string, IPropertyInfo> {
        const def = <JSONSchema7>this.schema.definitions[typeName];
        const res = {};
        Object.keys(def.properties).map(x => res[x] = {
            name: x,
            type: (<JSONSchema7>def.properties[x]).type
        });
        return res;
    }
}