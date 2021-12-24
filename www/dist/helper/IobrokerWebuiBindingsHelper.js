import { TypedEvent } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import { BindingTarget } from '/webui/node_modules/@node-projects/web-component-designer/dist/elements/item/BindingTarget.js';
import { iobrokerHandler } from '../IobrokerHandler.js';
export class IobrokerWebuiBindingsHelper {
    static parseBinding(element, name, value) {
        if (value.startsWith('{'))
            return [name.substring(8), JSON.parse(value)];
        let binding = {
            signal: value,
            target: BindingTarget.property
        };
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
    static serializeBinding(element, name, binding) {
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
    static *getBindings(element) {
        for (let a of element.attributes) {
            if (a.name.startsWith('binding:')) {
                yield IobrokerWebuiBindingsHelper.parseBinding(element, a.name, a.value);
            }
        }
    }
    static applyAllBindings(rootElement) {
        let retVal = [];
        let allElements = rootElement.querySelectorAll('*');
        for (let e of allElements) {
            const bindings = this.getBindings(e);
            for (let b of bindings) {
                retVal.push(this.applyBinding(e, b));
            }
        }
        return retVal;
    }
    static applyBinding(element, binding) {
        let cb = (id, value) => IobrokerWebuiBindingsHelper.handleValueChanged(element, binding, value);
        iobrokerHandler.connection.subscribeState(binding[1].signal, cb);
        if (binding[1].twoWay) {
            for (let e of binding[1].events) {
                const evt = element[e];
                if (evt instanceof TypedEvent) {
                    evt.on(() => {
                    });
                }
                else {
                    element.addEventListener(e, () => {
                    });
                }
            }
        }
        return () => iobrokerHandler.connection.unsubscribeState(binding[1].signal, cb);
    }
    static handleValueChanged(element, binding, value) {
        let v = value;
        if (binding[1].converter) {
        }
        if (binding[1].inverted)
            v = !v;
        if (binding[1].target == BindingTarget.property)
            element[binding[0]] = v;
        else if (binding[1].target == BindingTarget.attribute)
            element.setAttribute(binding[0], v);
        else if (binding[1].target == BindingTarget.css)
            element.style[binding[0]] = v;
    }
}
