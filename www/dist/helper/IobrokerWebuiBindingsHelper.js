import { TypedEvent } from '/webui/node_modules/@node-projects/base-custom-webcomponent/./dist/index.js';
import { BindingTarget } from '/webui/node_modules/@node-projects/web-component-designer/dist/elements/item/BindingTarget.js';
import { iobrokerHandler } from '../IobrokerHandler.js';
//;,[ are not allowed in bindings, so they could be used for a short form...
export const bindingPrefixProperty = 'bind-prop:';
export const bindingPrefixAttribute = 'bind-attr:';
export const bindingPrefixCss = 'bind-css:';
export class IobrokerWebuiBindingsHelper {
    static parseBinding(element, name, value, bindingTarget, prefix) {
        if (!value.startsWith('{')) {
            let binding = {
                signal: value,
                target: bindingTarget
            };
            if (value.startsWith('!')) {
                binding.signal = value.substring(1);
                binding.inverted = true;
            }
            return [name.substring(prefix.length), binding];
        }
        let binding = JSON.parse(value);
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
    static serializeBinding(element, name, binding) {
        if (binding.target == BindingTarget.property &&
            binding.converter == null &&
            (binding.events == null || binding.events.length == 0) &&
            !binding.twoWay)
            return [bindingPrefixProperty + name, (binding.inverted ? '!' : '') + binding.signal];
        let bindingCopy = Object.assign({}, binding); //can be removed with custom serialization
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
    static *getBindings(element) {
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
        let v = value.val;
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
