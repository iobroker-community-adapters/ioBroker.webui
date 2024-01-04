import { IDesignItem, IProperty, NativeElementsPropertiesService, PropertyType } from "@node-projects/web-component-designer";

export class IobrokerWebuiSpecialPropertiesService extends NativeElementsPropertiesService {
    override isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof HTMLInputElement;
    }

    public override getProperties(designItem: IDesignItem): IProperty[] {
        if (!this.isHandledElement(designItem))
            return null;

        let props = <IProperty[]>super.getProperties(designItem);

        let idx = props.findIndex(p => p.name === 'valueAsNumber');
        
        props.splice(idx + 1, 0, (<IProperty>{
            name: 'valueAsNumberLocal',
            type: "number",
            service: this,
            propertyType: PropertyType.propertyAndAttribute
        }));

        return props;
    }
}