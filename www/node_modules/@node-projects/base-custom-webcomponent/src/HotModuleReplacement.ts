import { BaseCustomWebComponentNoAttachedTemplate } from "./BaseCustomWebComponent";

export function getFunctionType(x) {
    return typeof x === 'function'
        ? x.prototype
            ? Object.getOwnPropertyDescriptor(x, 'prototype').writable
                ? 'function'
                : 'class'
            : x.constructor.name === 'AsyncFunction'
                ? 'async'
                : 'arrow'
        : '';
}

export class HotModuleReplacement {

    private static changesFetcher: () => Promise<string[]>;

    private static instances: WeakRef<any>[] = [];

    public static initHMR(fetchChangedFiles: () => Promise<string[]>) {
        HotModuleReplacement.changesFetcher = fetchChangedFiles;
        BaseCustomWebComponentNoAttachedTemplate.instanceCreatedCallback = (i) => {
            HotModuleReplacement.instances.push(new WeakRef(i));
        }
        HotModuleReplacement.startPolling();
    }

    public static startPolling(interval = 100) {
        setTimeout(() => {
            HotModuleReplacement.pollForChanges(interval);
        }, interval);
    }

    private static async pollForChanges(interval: number) {
        let changes = await HotModuleReplacement.changesFetcher()
        if (changes != null) {
            for (let file of changes) {
                HotModuleReplacement.assertFileType(file);
            }
        }
        setTimeout(() => {
            HotModuleReplacement.pollForChanges(interval);
        }, interval);
    }

    private static assertFileType(file: string) {
        switch (file.trim().toLowerCase().split(".").pop()) {
            case "css":
                console.warn("🔥 Hot reload - css: " + file);
                HotModuleReplacement.reloadCss(file);
                break;
            case "js":
            case "cjs":
            case "mjs":
                console.warn("🔥 Hot reload - js: " + file);
                HotModuleReplacement.reloadJs(file);
                break;
            default:
                break;
        }
    }
    static async reloadJs(file: string) {
        let oldModule = await import(file);

        let oldDefine = customElements.define
        customElements.define = () => null;
        let newModule = await import(file + "?reload=" + new Date().getTime());
        customElements.define = oldDefine;

        for (let nameOfexport in newModule) {
            const classExport = newModule[nameOfexport];
            if (getFunctionType(classExport) == 'class') {
                let i = HotModuleReplacement.instances.length;
                while (i--) {
                    let instanceRef = HotModuleReplacement.instances[i];
                    let instance = instanceRef.deref();
                    if (instance) {
                        if (classExport.name == instance.constructor.name) {
                            if (instance._hmrCallback)
                                instance._hmrCallback(classExport);
                        }
                    } else {
                        HotModuleReplacement.instances.splice(i, 1);
                    }
                }
            }
        }

        for (let nameOfexport in oldModule) {
            const oExport = oldModule[nameOfexport];
            if (getFunctionType(oExport) == 'class') {
                const newExport = newModule[nameOfexport];
                if (newExport) {
                    // Gets all attribute-properties of class
                    let properties = Object.getOwnPropertyNames(oExport);

                    for (let property of properties) {
                        if (property == 'prototype' || property == 'name' || property == 'length') continue;
                        delete oExport[property];
                        try {
                            oExport[property] = newExport[property];
                        } catch (err) { console.error("🔥 Hot reload - error setting property '" + property + "' of '" + oExport.name + "'", err); }
                    }

                    properties = Object.getOwnPropertyNames(oExport.prototype);
                    for (let property of properties) {
                        if (property == 'prototype' || property == 'name' || property == 'length') continue;
                        delete oExport[property];
                        try {
                            oExport.prototype[property] = newExport.prototype[property];
                        } catch (err) { console.error("🔥 Hot reload - error setting property '" + property + "' of '" + oExport.name + "'", err); }
                    }
                }
            }
        }
    }

    // Change the url of the stylesheet to force a reload
    private static async reloadCss(file: string) {
        const newId = new Date().getTime();
        for (let link of document.querySelectorAll<HTMLLinkElement>(`link[href*="${file}"]`))
            link.href = link.href.split("?")[0] + "?reload=" + newId;

        const oldCssModule = await import(file, { assert: { type: 'css' } });
        const newCssModule = await import(file + "?reload=" + newId, { assert: { type: 'css' } });
        const oldStylesheet: CSSStyleSheet = oldCssModule.default;
        const newStylesheet: CSSStyleSheet = newCssModule.default;
        oldStylesheet.replace(Array.from(newStylesheet.cssRules).map(rule => rule.cssText).join(''));
    }
} 