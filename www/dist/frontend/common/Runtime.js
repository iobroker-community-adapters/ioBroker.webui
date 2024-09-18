export class Runtime {
    static openScreen(config) {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }
    static openDialog(config) {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }
    static getParentScreen(screen) {
        return screen.getRootNode().host.getRootNode().host;
    }
    static findParent(element, type, predicate) {
        let current = element;
        while (current) {
            if (current instanceof type && current !== element) {
                if (predicate == null || predicate(current))
                    return current;
            }
            if (current.parentNode)
                current = current.parentNode;
            else
                current = current.host;
        }
        return null;
    }
}
window.RUNTIME = Runtime;
