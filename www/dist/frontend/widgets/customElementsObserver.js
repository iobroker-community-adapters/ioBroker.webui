class CustomElementsObserver {
    constructor() {
        this._newElements = new Map;
        let customElementsRegistry = window.customElements;
        const registry = {};
        registry.define = (name, constructor, options) => {
            if (this.currentLib) {
                let arr = this._newElements.get(this.currentLib);
                arr.push(name);
            }
            customElementsRegistry.define(name, constructor, options);
        };
        registry.get = (name) => {
            return customElementsRegistry.get(name);
        };
        registry.upgrade = (node) => {
            return customElementsRegistry.upgrade(node);
        };
        registry.whenDefined = (name) => {
            return customElementsRegistry.whenDefined(name);
        };
        Object.defineProperty(window, "customElements", {
            get() {
                return registry;
            }
        });
    }
    setCurrentLib(name) {
        this.currentLib = name;
        this._newElements.set(name, []);
    }
    getElements() {
        return this._newElements;
    }
}
var customElementsObserver = new CustomElementsObserver();
export default customElementsObserver;
