export class TypeScriptJsonSchemaPropertiesProvider {
    schema;
    constructor(schema) {
        this.schema = schema;
    }
    getProperties(typeName, instance) {
        const def = this.schema.definitions[typeName];
        const res = {};
        Object.keys(def.properties).map(x => res[x] = {
            name: x,
            type: def.properties[x].type
        });
        return res;
    }
}
