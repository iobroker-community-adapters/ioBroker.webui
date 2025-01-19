export class Runtime {
    static openScreen(config) {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenScreen', ...config }, null);
    }
    static openDialog(config) {
        return window.appShell.scriptSystem.runScriptCommand({ type: 'OpenDialog', ...config }, null);
    }
    static async runSimpleScriptCommand(scriptCommand) {
        await window.appShell.scriptSystem.runScriptCommand(scriptCommand, null); //TODO context
    }
    static getParentScreen(screen, parentLevel = 1) {
        let el = screen;
        for (let i = 0; i < parentLevel; i++) {
            let rootDiv = el.getRootNode().host;
            if (rootDiv instanceof BaseCustomControl)
                el = rootDiv;
            else
                el = rootDiv.getRootNode().host;
        }
        return el;
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
