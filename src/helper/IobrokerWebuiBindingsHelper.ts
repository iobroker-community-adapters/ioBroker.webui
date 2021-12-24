import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { BindingTarget } from "@node-projects/web-component-designer/dist/elements/item/BindingTarget";
import { IIobrokerWebuiBinding } from "../interfaces/IIobrokerWebuiBinding";
import { iobrokerHandler } from "../IobrokerHandler";

//;,[ are not allowed in bindings, so they could be used for a short form...

export const bindingPrefixProperty = 'bind-prop:';
export const bindingPrefixAttribute = 'bind-attr:';
export const bindingPrefixCss = 'bind-css:';

export type namedBinding = [name: string, binding: IIobrokerWebuiBinding];

export class IobrokerWebuiBindingsHelper {
    static parseBinding(element: Element, name: string, value: string, bindingTarget: BindingTarget, prefix: string): namedBinding {
        if (!value.startsWith('{')) {
            let binding: IIobrokerWebuiBinding = {
                signal: value,
                target: bindingTarget
            }
            if (value.startsWith('!')) {
                binding.signal = value.substring(1);
                binding.inverted = true;
            }

            return [name.substring(prefix.length), binding];
        }

        let binding: IIobrokerWebuiBinding = JSON.parse(value);
        binding.target = bindingTarget;

        if (binding.twoWay && (binding.events == null || binding.events.length == 0)) {
            if (element instanceof HTMLInputElement)
                binding.events = ['change'];
            else if (element instanceof HTMLInputElement)
                binding.events = ['change'];
            else
                binding.events = [name + '-changed'];
        }
        return [name.substring(prefix.length), binding];


    }

    static serializeBinding(element: Element, name: string, binding: IIobrokerWebuiBinding): [name: string, value: string] {
        if (binding.target == BindingTarget.property &&
            binding.converter == null &&
            (binding.events == null || binding.events.length == 0) &&
            !binding.twoWay)
            return [bindingPrefixProperty + name, (binding.inverted ? '!' : '') + binding.signal];

        let bindingCopy = { ...binding }; //can be removed with custom serialization
        //todo custom serialization
        //let str='{"signal":"'+binding.signal+'",'+binding.
        //remove default event name, not needed
        if (!binding.twoWay || (binding.events != null && binding.events.length == 1)) {
            if (element instanceof HTMLInputElement && binding.events[0] == "change")
                delete bindingCopy.events;
            else if (element instanceof HTMLInputElement && binding.events[0] == "change")
                delete bindingCopy.events;
            else if (element instanceof HTMLInputElement && binding.events[0] == name + '-changed')
                delete bindingCopy.events;
        }
        delete bindingCopy.target;

        if (binding.target == BindingTarget.attribute)
            return [bindingPrefixAttribute + name, JSON.stringify(bindingCopy)];
        if (binding.target == BindingTarget.css)
            return [bindingPrefixCss + name, JSON.stringify(bindingCopy)];
        return [bindingPrefixProperty + name, JSON.stringify(bindingCopy)];
    }

    static * getBindings(element: Element) {
        for (let a of element.attributes) {
            if (a.name.startsWith(bindingPrefixProperty)) {
                yield IobrokerWebuiBindingsHelper.parseBinding(element, a.name, a.value, BindingTarget.property, bindingPrefixProperty);
            }
            else if (a.name.startsWith(bindingPrefixAttribute)) {
                yield IobrokerWebuiBindingsHelper.parseBinding(element, a.name, a.value, BindingTarget.attribute, bindingPrefixAttribute);
            }
            else if (a.name.startsWith(bindingPrefixCss)) {
                yield IobrokerWebuiBindingsHelper.parseBinding(element, a.name, a.value, BindingTarget.css, bindingPrefixCss);
            }
        }
    }

    static applyAllBindings(rootElement: ParentNode): (() => void)[] {
        let retVal: (() => void)[] = [];
        let allElements = rootElement.querySelectorAll('*');
        for (let e of allElements) {
            const bindings = this.getBindings(e);
            for (let b of bindings) {
                retVal.push(this.applyBinding(e, b));
            }
        }
        return retVal;
    }

    static applyBinding(element: Element, binding: namedBinding): () => void {
        let cb = (id: string, value: any) => IobrokerWebuiBindingsHelper.handleValueChanged(element, binding, value);
        iobrokerHandler.connection.subscribeState(binding[1].signal, cb);
        if (binding[1].twoWay) {
            for (let e of binding[1].events) {
                const evt = element[e];
                if (evt instanceof TypedEvent) {
                    evt.on(() => {

                    })
                } else {
                    element.addEventListener(e, () => {

                    });
                }
            }
        }
        return () => iobrokerHandler.connection.unsubscribeState(binding[1].signal, cb);
    }

    static handleValueChanged(element: Element, binding: namedBinding, value: any) {
        let v = value.val;
        if (binding[1].converter) {

        }
        if (binding[1].inverted)
            v = !v;
        if (binding[1].target == BindingTarget.property)
            element[binding[0]] = v
        else if (binding[1].target == BindingTarget.attribute)
            element.setAttribute(binding[0], v)
        else if (binding[1].target == BindingTarget.css)
            (<HTMLElement>element).style[binding[0]] = v
    }
}

