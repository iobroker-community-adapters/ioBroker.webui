import { expect } from 'chai';
import { readFile } from 'node:fs/promises';
import { inlineSchemaScalars } from '../../scripts/inline-schema-scalars.mjs';

// Exercise the installed converter without importing its browser custom-element classes.
const source=await readFile(new URL('../../node_modules/@node-projects/propertygrid.webcomponent/dist/PropertyGrid.js',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('let nullObject;'),source.indexOf('export class PropertyGrid'));
const {typeInfoFromJsonSchema}=await import('data:text/javascript,'+encodeURIComponent(helpers));
const commands=JSON.parse(await readFile(new URL('../../src/frontend/generated/ScriptCommands.json',import.meta.url),'utf8'));

describe('Property-grid scalar schema aliases',()=>{
    it('inlines scalar aliases and chains while preserving local metadata and object/collection refs',()=>{
        const schema={definitions:{Mode:{type:'string',enum:['signal','property'],description:'base'},Alias:{$ref:'#/definitions/Mode'},Child:{type:'object',default:{$ref:'#/definitions/Mode'},properties:{name:{type:'string'}}},Root:{type:'object',properties:{mode:{$ref:'#/definitions/Alias',description:'local',default:'signal'},child:{$ref:'#/definitions/Child'},children:{type:'array',items:{$ref:'#/definitions/Child'}}}}}};
        const normalized=inlineSchemaScalars(schema);
        expect(normalized.definitions.Root.properties.mode).to.deep.equal({type:'string',enum:['signal','property'],description:'local',default:'signal'});
        expect(normalized.definitions.Child.default).to.deep.equal({$ref:'#/definitions/Mode'});
        expect(normalized.definitions.Root.properties.child).to.deep.equal({$ref:'#/definitions/Child'});
        expect(normalized.definitions.Root.properties.children.items).to.deep.equal({$ref:'#/definitions/Child'});
        expect(schema.definitions.Root.properties.mode.$ref).to.equal('#/definitions/Alias');
        expect(inlineSchemaScalars(normalized)).to.deep.equal(normalized);
    });
    it('retains unknown or cyclic references instead of recursing forever',()=>{
        const schema={definitions:{A:{$ref:'#/definitions/B'},B:{$ref:'#/definitions/A'},C:{$ref:'#/definitions/Missing'}}};
        expect(inlineSchemaScalars(schema)).to.deep.equal(schema);
    });
    it('renders SetSignalValue signal/target/value fields using the real installed property-grid converter',()=>{
        const info=typeInfoFromJsonSchema(commands,{type:'SetSignalValue',value:500});
        expect(info.properties.map(property=>property.name)).to.deep.equal(['signal','target','value','additionalData']);
        const target=info.properties.find(property=>property.name==='target');
        expect(target.type).to.equal('enum'); expect(target.values).to.deep.equal(['elementProperty','property','signal']);
        expect(info.properties.find(property=>property.name==='signal').format).to.equal('signal');
        // These are the subtype probes performed while the grid builds each row.
        for(const property of info.properties) expect(()=>typeInfoFromJsonSchema(commands,null,property.type)).not.to.throw();
    });
    it('keeps every generated command subtype probe valid, including commands in If branches',()=>{
        const named=Object.entries(commands.definitions).filter(([,definition])=>definition.type==='object' && definition.properties?.type?.const);
        expect(named.length).to.be.greaterThan(20);
        for(const [name] of named) {
            const info=typeInfoFromJsonSchema(commands,{type:name});
            for(const property of info.properties) expect(()=>typeInfoFromJsonSchema(commands,null,property.type),`${name}.${property.name}`).not.to.throw();
        }
    });
});
