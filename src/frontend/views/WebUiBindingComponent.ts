import { BaseCustomWebComponentNoAttachedTemplate, customElement, property } from "@node-projects/base-custom-webcomponent";

@customElement('web-ui-bc')
export class WebUiBindingComponent extends BaseCustomWebComponentNoAttachedTemplate {
    @property(String)
    type: 'style' | 'attribute';
    @property(String)
    objectId: string;
    @property(String)
    condition?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'consist' | 'notConsist' | 'exist' | 'notExist'
    @property(String)
    compareValue?: any
    @property(String)
    trueValue?: any;
    @property(String)
    falseValue?: any;
    @property(Boolean)
    invert?: boolean;

    //converter?: any //todo 
}