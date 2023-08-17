class CustomElementsObserver {

    private _newElements = new Map<string, string[]>;
    private currentLib: string;

    constructor() {
        let customElementsRegistry = window.customElements;
        const registry: any = {};

        registry.define = (name, constructor, options) => {
            if (this.currentLib) {
                let arr = this._newElements.get(this.currentLib);
                arr.push(name);
            }
            customElementsRegistry.define(name, constructor, options);
        }
        registry.get = (name) => {
            return customElementsRegistry.get(name);
        }
        registry.upgrade = (node) => {
            return customElementsRegistry.upgrade(node);
        }
        registry.whenDefined = (name) => {
            return customElementsRegistry.whenDefined(name);
        }

        Object.defineProperty(window, "customElements", {
            get() {
                return registry
            }
        });
    }

    setCurrentLib(name: string) {
        this.currentLib = name;
        this._newElements.set(name, []);
    }

    finishedCurrentLib() {
        this.currentLib = null;
    }

    getElements() {
        return this._newElements;
    }
}

var customElementsObserver = new CustomElementsObserver();

export default customElementsObserver;