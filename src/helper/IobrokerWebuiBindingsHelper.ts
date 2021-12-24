import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { BindingTarget } from "@node-projects/web-component-designer/dist/elements/item/BindingTarget";
import { IIobrokerWebuiBinding } from "../interfaces/IIobrokerWebuiBinding";
import { iobrokerHandler } from "../IobrokerHandler";

//;,[ are not allowed in bindings, so they could be used for a short form...

export type namedBinding = [name: string, binding: IIobrokerWebuiBinding];

export class IobrokerWebuiBindingsHelper {
    static parseBinding(element: Element, name: string, value: string): namedBinding {
        if (value.startsWith('{'))
            return [name.substring(8), JSON.parse(value)];

        let binding: IIobrokerWebuiBinding = {
            signal: value,
            target: BindingTarget.property
        }
        if (value.startsWith('!')) {
            binding.signal = value.substring(1);
            binding.inverted = true;
        }

        if (binding.twoWay && (binding.events == null || binding.events.length == 0)) {
            if (element instanceof HTMLInputElement)
                binding.events = ['change'];
            else if (element instanceof HTMLInputElement)
                binding.events = ['change'];
            else
                binding.events = [name + '-changed'];
        }

        return [name.substring(8), binding];
    }

    static serializeBinding(element: Element, name: string, binding: IIobrokerWebuiBinding): string {
        if (binding.target == BindingTarget.property &&
            binding.converter == null &&
            (binding.events == null || binding.events.length == 0) &&
            !binding.twoWay)
            return (binding.inverted ? '!' : '') + binding.signal;

        //remove default event name, not needed
        if (!binding.twoWay || (binding.events != null && binding.events.length == 1)) {
            if (element instanceof HTMLInputElement && binding.events[0] == "change")
                delete binding.events;
            else if (element instanceof HTMLInputElement && binding.events[0] == "change")
                delete binding.events;
            else if (element instanceof HTMLInputElement && binding.events[0] == name + '-changed')
                delete binding.events;
        }
        return JSON.stringify(binding);
    }

    static * getBindings(element: Element) {
        for (let a of element.attributes) {
            if (a.name.startsWith('binding:')) {
                yield IobrokerWebuiBindingsHelper.parseBinding(element, a.name, a.value);
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
        let v = value;
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

