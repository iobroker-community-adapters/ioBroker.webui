import { BaseCustomWebComponentLazyAppend, BaseCustomWebComponentConstructorAppend, BaseCustomWebComponentNoAttachedTemplate, BaseCustomWebComponentConstructorAppendLazyReady } from '@node-projects/base-custom-webcomponent';
import { AbstractPolymerLikePropertiesService } from './AbstractPolymerLikePropertiesService.js';
export class BaseCustomWebComponentPropertiesService extends AbstractPolymerLikePropertiesService {
    name = "baseCustomWebComponent";
    isHandledElement(designItem) {
        return designItem.element instanceof BaseCustomWebComponentLazyAppend ||
            designItem.element instanceof BaseCustomWebComponentConstructorAppendLazyReady ||
            designItem.element instanceof BaseCustomWebComponentConstructorAppend ||
            designItem.element instanceof BaseCustomWebComponentNoAttachedTemplate;
    }
    _notifyChangedProperty(designItem, property, value) {
        //@ts-ignore
        designItem.element._parseAttributesToProperties();
    }
}
//# sourceMappingURL=BaseCustomWebComponentPropertiesService.js.map