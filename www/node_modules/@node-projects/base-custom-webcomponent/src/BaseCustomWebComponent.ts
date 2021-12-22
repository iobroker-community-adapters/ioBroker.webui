import { addTouchFriendlyContextMenu } from "./TouchContextMenu.js";
import { TypedEvent } from './TypedEvent.js';

export const html = function (strings: TemplateStringsArray, ...values: any[]): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = strings.raw[0];
    return template;
};

export const htmlFromString = function (value: string): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = value;
    return template;
};

export const css = function (strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {
    const cssStyleSheet = new CSSStyleSheet();
    //@ts-ignore
    cssStyleSheet.replaceSync(strings.raw[0]);
    return cssStyleSheet;
};

export const cssFromString = function (value: string): CSSStyleSheet {
    const cssStyleSheet = new CSSStyleSheet();
    //@ts-ignore
    cssStyleSheet.replaceSync(value);
    return cssStyleSheet;
};

export const cssAsync = async function (strings: TemplateStringsArray, ...values: any[]): Promise<CSSStyleSheet> {
    const cssStyleSheet = new CSSStyleSheet();
    //@ts-ignore
    await cssStyleSheet.replace(strings.raw[0]);
    return cssStyleSheet;
};

type propertySimpleDefinition = Object | BooleanConstructor | DateConstructor | NumberConstructor | StringConstructor | ArrayConstructor | ObjectConstructor //| Object //| (new (...args: any[]) => object)
type propertyComplexDefinition = { type: propertySimpleDefinition; };
type propertyDefinition = propertyComplexDefinition | propertySimpleDefinition;

// decorators
export function property(par?: propertyDefinition) {
    return function (target: Object, propertyKey: PropertyKey) {
        //@ts-ignore
        if (!target.constructor.properties) {
            //@ts-ignore
            target.constructor.properties = {};
        }
        if (par && (<propertyComplexDefinition>par).type != null) {
            //@ts-ignore
            target.constructor.properties[propertyKey] = (<propertyComplexDefinition>par).type ? (<propertyComplexDefinition>par).type : String;
        }
        else {
            //@ts-ignore
            target.constructor.properties[propertyKey] = par ? par : String;
        }
    }
}

export function customElement(tagname: string) {
    return function (class_: (new (...par) => BaseCustomWebComponentNoAttachedTemplate)) {
        //@ts-ignore
        class_.is = tagname;

        customElements.define(tagname, class_);
    }
}

type repeatBindingItem = { name: string, item: any }

export class BaseCustomWebComponentNoAttachedTemplate extends HTMLElement {
    static readonly style: CSSStyleSheet | Promise<CSSStyleSheet>;
    static readonly template: HTMLTemplateElement;

    protected _bindings: ((firstRun?: boolean) => void)[];
    protected _repeatWeakMap: WeakMap<any, Element[]>;

    //@ts-ignore
    private static _bindingRegex = /\[\[.*?\]\]/g;

    protected _getDomElement<T extends Element>(id: string): T {
        if (this.shadowRoot.children.length > 1 || (this.shadowRoot.children[0] !== undefined && this.shadowRoot.children[0].localName !== 'style'))
            return <T>(<any>this.shadowRoot.getElementById(id));
        return <T>(<any>this._rootDocumentFragment.getElementById(id));
    }

    protected _getDomElements<T extends Element>(selector: string): T[] {
        if (this.shadowRoot.children.length > 1 || (this.shadowRoot.children[0] !== undefined && this.shadowRoot.children[0].localName !== 'style'))
            return <T[]>(<any>this.shadowRoot.querySelectorAll(selector));
        return <T[]>(<any>this._rootDocumentFragment.querySelectorAll(selector));
    }

    protected _assignEvents(node?: Node) {
        if (!node) {
            node = this.shadowRoot.children.length > 0 ? this.shadowRoot : this._rootDocumentFragment;
        }
        if (node instanceof Element) {
            for (let a of node.attributes) {
                if (a.name.startsWith('@') && !a.value.startsWith('[[')) {
                    try {
                        if (a.name == "@touch:contextmenu")
                            addTouchFriendlyContextMenu(node, this[a.value].bind(this));
                        else {
                            const sNm = a.name.substr(1);
                            let nm = sNm.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                            if (node[nm] instanceof TypedEvent) {
                                (<TypedEvent<any>>node[nm]).on(this[a.value].bind(this));
                            } else {
                                node.addEventListener(sNm, this[a.value].bind(this));
                            }
                        }
                    } catch (error) {
                        console.warn((<Error>error).message, 'Failed to attach event "', a, node);
                    }
                }
            }
        }
        for (let n of node.childNodes) {
            this._assignEvents(n);
        }
    }

    /**
     * Parses Polymer like Bindings
     * 
     * use [[expression]] for one way bindings
     * 
     * use {{this.property::change;paste}} for two way wich binds to events 'change 'and 'paste'
     * 
     * use @eventname="eventHandler" to bind a handler to a event
     * or @eventname="[[this.eventHandler(par1, par2, ..)]]" for complexer event logic 
     * use @touch:contextmenu... for a context menu that also works with long press on touch
     * 
     * use css:cssPropertyName=[[expression]] to bind to a css property
     * 
     * use class:className=[[boolExpression]] to set/remove a css class
     * 
     * sub <template></template> elements are not bound, so elemnts like <iron-list> of polymer also work
     * 
     * use repeat:nameOfItem=[[enumerableExpression]] on a Template Element to repeate it for every instance of the enumarable
     * ==> this could also be nested
     * 
     */
    protected _bindingsParse(node?: Node, removeAttributes = false, host: any = null, context: any = null) {
        this._bindingsInternalParse(node, null, removeAttributes, host, context);
    }

    private _bindingsInternalParse(node: Node, repeatBindingItems: repeatBindingItem[], removeAttributes: boolean, host: any, context: any) {
        if (!this._bindings)
            this._bindings = [];
        if (!node)
            node = this.shadowRoot.childNodes.length > 0 ? this.shadowRoot : this._rootDocumentFragment;
        if (node instanceof Element) { //node.nodeType === 1
            let attributes = Array.from(node.attributes);
            for (let a of attributes) {
                if (a.name.startsWith('css:') && a.value.startsWith('[[') && a.value.endsWith(']]')) {
                    let value = a.value.substring(2, a.value.length - 2).replaceAll('&amp;', '&');
                    let camelCased = a.name.substring(4, a.name.length).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    this._bindings.push(() => this._bindingSetElementCssValue(<HTMLElement | SVGElement>node, camelCased, value, repeatBindingItems, host, context));
                    this._bindings[this._bindings.length - 1](true);
                } else if (a.name.startsWith('class:') && a.value.startsWith('[[') && a.value.endsWith(']]')) {
                    let value = a.value.substring(2, a.value.length - 2).replaceAll('&amp;', '&');
                    let camelCased = a.name.substring(6, a.name.length).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    this._bindings.push(() => this._bindingSetElementClass(<HTMLElement | SVGElement>node, camelCased, value, repeatBindingItems, host, context));
                    this._bindings[this._bindings.length - 1](true);
                } else if (a.name == 'repeat-changed-item-callback') {
                    //do nothing
                } else if (a.name.startsWith('repeat:') && a.value.startsWith('[[') && a.value.endsWith(']]')) {
                    let value = a.value.substring(2, a.value.length - 2).replaceAll('&amp;', '&');
                    let bindingItemVariableName = a.name.substring(7, a.name.length).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    let elementsCache: Node[] = [];
                    let bindingIndexname = 'index';
                    let changeItemCallback = null;
                    let indexNameAttribute = attributes.find(x => x.name == 'repeat-index');
                    if (indexNameAttribute)
                        bindingIndexname = indexNameAttribute.value;
                    let changeItemCallbackAttribute = attributes.find(x => x.name == 'repeat-changed-item-callback');
                    if (changeItemCallbackAttribute)
                        changeItemCallback = changeItemCallbackAttribute.value;
                    this._bindings.push(() => this._bindingRepeat(<HTMLTemplateElement>node, bindingItemVariableName, bindingIndexname, value, changeItemCallback, repeatBindingItems, elementsCache, host, context));
                    this._bindings[this._bindings.length - 1](true);
                } else if (a.name.startsWith('@') && a.value.startsWith('[[') && a.value.endsWith(']]')) { //todo remove events on repeat refresh
                    let value = a.value.substring(2, a.value.length - 2).replaceAll('&amp;', '&');
                    let camelCased = a.name.substring(1, a.name.length).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    if (a.name == "@touch:contextmenu")
                        addTouchFriendlyContextMenu(node, (e) => this._bindingRunEval(value, repeatBindingItems, e, host, context));
                    else {
                        if (node[camelCased] instanceof TypedEvent) {
                            (<TypedEvent<any>>node[camelCased]).on((e) => this._bindingRunEval(value, repeatBindingItems, e, host, context));
                        } else {
                            node.addEventListener(camelCased, (e) => this._bindingRunEval(value, repeatBindingItems, e, host, context));
                        }
                    }
                } else if (a.value.startsWith('[[') && a.value.endsWith(']]')) {
                    let value = a.value.substring(2, a.value.length - 2).replaceAll('&amp;', '&');
                    let camelCased = a.name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    let noNull = false;
                    if (value.startsWith('?')) {
                        value = value.substring(1);
                        noNull = true;
                    }
                    this._bindings.push((firstRun?: boolean) => this._bindingSetNodeValue(firstRun, node, a, camelCased, value, repeatBindingItems, removeAttributes, host, context, noNull));
                    this._bindings[this._bindings.length - 1](true);
                } else if (a.value.startsWith('{{') && a.value.endsWith('}}')) {
                    const attributeValues = a.value.substring(2, a.value.length - 2).split('::');
                    let value = attributeValues[0];
                    let event = 'input';
                    if (attributeValues.length > 1 && attributeValues[1])
                        event = attributeValues[1];
                    let camelCased = a.name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    if (camelCased.startsWith('set:')) {
                        const pName = camelCased.substring(4);
                        event.split(';').forEach(x => node.addEventListener(x, (e) => {
                            let ctx = { value: node[pName] };
                            ctx[pName] = node[pName]; //value is in value or property-name
                            this._bindingRunEval(value, repeatBindingItems, e, host, { value: node[pName] })
                        }));
                    } else {
                        let noNull = false;
                        if (value.startsWith('?')) {
                            value = value.substring(1);
                            noNull = true;
                        }
                        this._bindings.push((firstRun?: boolean) => this._bindingSetNodeValue(firstRun, node, a, camelCased, value, repeatBindingItems, removeAttributes, host, context, noNull));
                        this._bindings[this._bindings.length - 1](true);
                        if (event) {
                            event.split(';').forEach(x => node.addEventListener(x, (e) => this._bindingsSetValue(this, value, (<HTMLInputElement>node)[camelCased])));
                        }
                    }
                }
            }
        } else if (node.nodeType === 3) {
            if (node.nodeValue.indexOf('[[') >= 0) {
                const text = node.nodeValue;
                let matches = text.matchAll((<RegExp>(<any>this.constructor)._bindingRegex));
                let lastindex = 0;
                let fragment: DocumentFragment;
                for (let m of matches) {
                    if (m.index == 0 && m[0].length == text.length && node.parentNode.childNodes.length == 1) {
                        let value = m[0].substr(2, m[0].length - 4);
                        let parent = node.parentNode;
                        node.parentNode.removeChild(node);
                        this._bindings.push((firstRun?: boolean) => this._bindingSetNodeValue(firstRun, parent, null, 'innerHTML', value, repeatBindingItems, removeAttributes, host, context, false));
                        this._bindings[this._bindings.length - 1](true);
                    } else {
                        if (!fragment)
                            fragment = document.createDocumentFragment();
                        if (m.index - lastindex > 0) {
                            let tn = document.createTextNode(text.substr(lastindex, m.index - lastindex));
                            fragment.appendChild(tn);
                        }
                        const newNode = document.createElement('span');
                        let value = m[0].substr(2, m[0].length - 4);
                        this._bindings.push((firstRun?: boolean) => this._bindingSetNodeValue(firstRun, newNode, null, 'innerHTML', value, repeatBindingItems, removeAttributes, host, context, false));
                        this._bindings[this._bindings.length - 1](true);
                        fragment.appendChild(newNode);
                        lastindex = m.index + m[0].length;
                    }
                }
                if (fragment) {
                    if (lastindex > 0 && text.length - lastindex > 0) {
                        let tn = document.createTextNode(text.substr(lastindex, text.length - lastindex));
                        fragment.appendChild(tn);
                    }
                    node.parentNode.replaceChild(fragment, node);
                }
            }
        }

        if (!(node instanceof HTMLTemplateElement)) {
            let children = Array.from(node.childNodes);
            for (let n of children) {
                this._bindingsInternalParse(n, repeatBindingItems, removeAttributes, host, context);
            }
        }
    }

    private _bindingRunEval(expression: string, repeatBindingItems: repeatBindingItem[], event: Event, host: any, context: any) {
        if (host)
            return this._bindingRunEvalInt.bind(host)(expression, repeatBindingItems, event, context)
        return this._bindingRunEvalInt(expression, repeatBindingItems, event, context)
    }

    //This method can not use "this" anywhere, cause it's bound to different host via method above.
    private _bindingRunEvalInt(expression: string, repeatBindingItems: repeatBindingItem[], event: Event, context: any) {
        if (repeatBindingItems) {
            let n = 0;
            let set = new Set();
            for (let b of repeatBindingItems) {
                if (!set.has(b.name)) {
                    expression = 'let ' + b.name + ' = ___repeatBindingItems[' + n + '].item;' + expression;
                    set.add(b.name);
                }
                n++;
            }
            if (event) {
                expression = 'let event = ___event;' + expression;
            }
            if (context) {
                for (let i in context) {
                    expression = 'let ' + i + ' = ___context["' + i + '"];' + expression;
                }
            }

            //@ts-ignore
            var ___repeatBindingItems = repeatBindingItems;
            //@ts-ignore
            var ___event = event;
            //@ts-ignore
            var ___context = context;
            let value = eval(expression);
            return value;
        }
        if (context) {
            for (let i in context) {
                expression = 'let ' + i + ' = ___context["' + i + '"];' + expression;
            }
            //@ts-ignore
            var ___context = context;
            let value = eval(expression);
            return value;
        }
        let value = eval(expression);
        return value;
    }

    private _bindingRepeat(node: HTMLTemplateElement, bindingProperty: string, bindingIndexName: string, expression: string, callback: string, repeatBindingItems: repeatBindingItem[], elementsCache: Node[], host: any, context: any) {
        try {
            const values = this._bindingRunEval(expression, repeatBindingItems, null, host, context);
            if (values) {
                if (callback) {
                    if (callback.startsWith('[[') && callback.endsWith(']]'))
                        callback = callback.substring(2, callback.length - 2);
                    else
                        callback = "this." + callback;
                }

                for (let c of elementsCache) { // todo bindings of childs need to be killed
                    if (c.parentNode) {
                        let intRepeatBindingItems: repeatBindingItem[] = [];
                        intRepeatBindingItems.push({ name: 'nodes', item: [c] });
                        intRepeatBindingItems.push({ name: 'callbackType', item: 'remove' });
                        this._bindingRunEval(callback, intRepeatBindingItems, null, host, context);
                        c.parentNode.removeChild(c);
                    }
                }
                let i = 0;
                for (let e of values) {
                    let intRepeatBindingItems: repeatBindingItem[] = [];
                    if (repeatBindingItems)
                        intRepeatBindingItems = repeatBindingItems.slice();
                    intRepeatBindingItems.push({ name: bindingProperty, item: e });
                    intRepeatBindingItems.push({ name: bindingIndexName, item: i });
                    let nd = <DocumentFragment>node.content.cloneNode(true);
                    elementsCache.push(...nd.children);
                    this._bindingsInternalParse(nd, intRepeatBindingItems, true, host, context);

                    if (callback) {
                        intRepeatBindingItems.push({ name: 'nodes', item: nd.children });
                        intRepeatBindingItems.push({ name: 'callbackType', item: 'create' });
                        let nds = this._bindingRunEval(callback, intRepeatBindingItems, null, host, context);
                        if (nds === undefined)
                            nds = nd.children;
                        if (nds) {
                            for (let n of Array.from(nds))
                                node.parentNode.appendChild(<Node>n);
                        }
                    }
                    else {
                        node.parentNode.appendChild(nd);
                    }
                    i++;
                }
            }
        } catch (error) {
            console.warn((<Error>error).message, 'Failed to bind Repeat "' + bindingProperty + '" to expression "' + expression + '"', node);
        }
    }

    private _bindingSetNodeValue(firstRun: boolean, node: Node, attribute: Attr, property: string, expression: string, repeatBindingItems: repeatBindingItem[], removeAttributes: boolean, host: any, context: any, noNull: boolean) {
        try {
            const value = this._bindingRunEval(expression, repeatBindingItems, null, host, context);
            if (firstRun || node[property] !== value) {
                if (removeAttributes && attribute)
                    (<Element>node).removeAttribute(attribute.name);
                if (property === 'innerHTML' && value instanceof Element) {
                    for (let c = node.firstChild; c !== null; c = node.firstChild) {
                        node.removeChild(c);
                    }
                    (<Element>node).appendChild(value)
                } else {
                    if (property[0] == '$') {
                        if (!value && noNull)
                            (<Element>node).setAttribute(property.substring(1, property.length), '');
                        else
                            (<Element>node).setAttribute(property.substring(1, property.length), value);
                    }
                    else if (property == 'class')
                        (<Element>node).setAttribute(property, value);
                    else {
                        if (!value && noNull)
                            node[property] = '';
                        else
                            node[property] = value;
                    }
                }
            }
        } catch (error) {
            console.warn((<Error>error).message, 'Failed to bind Property "' + property + '" to expression "' + expression + '"', node);
        }
    }

    private _bindingSetElementCssValue(node: HTMLElement | SVGElement, property: string, expression: string, repeatBindingItems: repeatBindingItem[], host: any, context: any) {
        try {
            const value = this._bindingRunEval(expression, repeatBindingItems, null, host, context);
            if (node.style[property] !== value)
                node.style[property] = value;
        } catch (error) {
            console.warn((<Error>error).message, 'Failed to bind CSS Property "' + property + '" to expression "' + expression + '"', node);
        }
    }

    private _bindingSetElementClass(node: HTMLElement | SVGElement, classname: string, expression: string, repeatBindingItems: repeatBindingItem[], host: any, context: any) {
        try {
            const value = this._bindingRunEval(expression, repeatBindingItems, null, host, context);
            if (value) {
                if (!node.classList.contains(classname))
                    node.classList.add(classname);
            }
            else {
                if (node.classList.contains(classname))
                    node.classList.remove(classname);
            }
        } catch (error) {
            console.warn((<Error>error).message, 'Failed to bind CSS Class "' + classname + '" to expression "' + expression + '"', node);
        }
    }

    protected _bindingsRefresh(property?: string) {
        if (this._bindings)
            this._bindings.forEach(x => x(false));
    }

    protected _bindingsSetValue(obj, path: string, value) {
        if (path === undefined || path === null) {
            return;
        }

        if (path.startsWith('this.')) {
            path = path.substr(5);
        }
        const pathParts = path.split('.');
        for (let i = 0; i < pathParts.length - 1; i++) {
            if (obj != null) {
                let newObj = obj[pathParts[i]];
                if (newObj == null) {
                    newObj = {};
                    obj[pathParts[i]] = newObj;
                }
                obj = newObj;
            }
        }

        obj[pathParts[pathParts.length - 1]] = value;
    }

    //@ts-ignore
    private static _propertiesDictionary: Map<string, string>;
    protected _parseAttributesToProperties() {
        //@ts-ignore
        if (!this.constructor._propertiesDictionary) {
            //@ts-ignore
            this.constructor._propertiesDictionary = new Map<string, [string, any]>();
            //@ts-ignore
            for (let i in this.constructor.properties) {
                //@ts-ignore
                this.constructor._propertiesDictionary.set(i.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`), [i, this.constructor.properties[i]]);
            }
        }
        for (const a of this.attributes) {
            //@ts-ignore
            let pair = this.constructor._propertiesDictionary.get(a.name);
            if (pair) {
                if (pair[1] === Boolean)
                    this[pair[0]] = true;
                else if (pair[1] === Object) {
                    if (!a.value.startsWith("{{") && !a.value.startsWith("[["))
                        this[pair[0]] = JSON.parse(a.value);
                }
                else
                    this[pair[0]] = a.value;
            }
        }
    }

    /*attributeChangedCallback(name, oldValue, newValue) {
      //@ts-ignore
      if (this.constructor._propertiesDictionary) {
        this._parseAttributesToProperties();
      }
    }*/

    protected async _waitForChildrenReady() {
        await Promise.all(Array.from(this.shadowRoot.querySelectorAll(':not(:defined)'), n => customElements.whenDefined(n.localName)));
    }

    protected _rootDocumentFragment: DocumentFragment;

    constructor(template?: HTMLTemplateElement, style?: CSSStyleSheet) {
        super();

        this.attachShadow({ mode: 'open' });

        if (template) {
            //@ts-ignore
            this._rootDocumentFragment = template.content.cloneNode(true);
        }
        //@ts-ignore
        else if (this.constructor.template) {
            //@ts-ignore
            this._rootDocumentFragment = this.constructor.template.content.cloneNode(true);
        }

        if (style) {
            //@ts-ignore
            if (style instanceof Promise)
                //@ts-ignore
                style.then((s) => this.shadowRoot.adoptedStyleSheets = [s]);
            else
                //@ts-ignore
                this.shadowRoot.adoptedStyleSheets = [style];
            //@ts-ignore
        } else if (this.constructor.style) {

            //@ts-ignore
            if (this.constructor.style instanceof Promise)
                //@ts-ignore
                this.constructor.style.then((style) => this.shadowRoot.adoptedStyleSheets = [style]);
            else
                //@ts-ignore
                this.shadowRoot.adoptedStyleSheets = [this.constructor.style];
        }
    }
}

export class BaseCustomWebComponentLazyAppend extends BaseCustomWebComponentNoAttachedTemplate {
    constructor(template?: HTMLTemplateElement, style?: CSSStyleSheet) {
        super(template, style)
        queueMicrotask(() => {
            if (this._rootDocumentFragment)
                this.shadowRoot.appendChild(this._rootDocumentFragment);
            //@ts-ignore
            if (this.oneTimeSetup && !this.constructor._oneTimeSetup) {
                //@ts-ignore
                this.constructor._oneTimeSetup = true;
                //@ts-ignore
                this.oneTimeSetup();
            }
            //@ts-ignore
            if (this.ready)
                //@ts-ignore
                this.ready();
        })
    }
}

export class BaseCustomWebComponentConstructorAppend extends BaseCustomWebComponentNoAttachedTemplate {
    constructor(template?: HTMLTemplateElement, style?: CSSStyleSheet) {
        super(template, style)

        if (this._rootDocumentFragment)
            this.shadowRoot.appendChild(this._rootDocumentFragment);

        queueMicrotask(() => {

            //@ts-ignore
            if (this.oneTimeSetup && !this.constructor._oneTimeSetup) {
                //@ts-ignore
                this.constructor._oneTimeSetup = true;
                //@ts-ignore
                this.oneTimeSetup();
            }
            //@ts-ignore
            if (this.ready)
                //@ts-ignore
                this.ready();
        })
    }
}

export class BaseCustomWebComponentConstructorAppendLazyReady extends BaseCustomWebComponentNoAttachedTemplate {
    constructor(template?: HTMLTemplateElement, style?: CSSStyleSheet) {
        super(template, style)
        if (this._rootDocumentFragment)
            this.shadowRoot.appendChild(this._rootDocumentFragment);

        requestAnimationFrame(() => {

            //@ts-ignore
            if (this.oneTimeSetup && !this.constructor._oneTimeSetup) {
                //@ts-ignore
                this.constructor._oneTimeSetup = true;
                //@ts-ignore
                this.oneTimeSetup();
            }
            //@ts-ignore
            if (this.ready)
                //@ts-ignore
                this.ready();
        })
    }
}