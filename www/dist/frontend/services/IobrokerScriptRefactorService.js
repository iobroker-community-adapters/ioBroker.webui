import { BindingTarget } from "@node-projects/web-component-designer";
export class IobrokerScriptRefactorService {
    getRefactorings(designItems) {
        let refactorings = [];
        for (let d of designItems) {
            for (let a of d.attributes()) {
                if (a[0][0] == '@') {
                    let sc = a[1];
                    if (sc[0] == '{') {
                        let script = JSON.parse(sc);
                        for (let c of script.commands) {
                            for (let p in c) {
                                let cp = c[p];
                                if (typeof cp === 'object') {
                                    let mp = cp;
                                    if (mp.source == 'signal') {
                                        refactorings.push({ name: mp.name, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], service: this, designItem: d, type: 'script', sourceObject: script, display: c.type + '/' + p, refactor: newValue => mp.name = newValue });
                                    }
                                }
                            }
                            switch (c.type) {
                                case 'SetSignalValue':
                                    if (c.signal)
                                        refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                    break;
                                case 'ToggleSignalValue':
                                    if (c.signal)
                                        refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                    break;
                                case 'IncrementSignalValue':
                                    if (c.signal)
                                        refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                    break;
                                case 'DecrementSignalValue':
                                    if (c.signal)
                                        refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                    break;
                                case 'SetBitInSignal':
                                    if (c.signal)
                                        refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                    break;
                                case 'ClearBitInSignal':
                                    if (c.signal)
                                        refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                    break;
                                case 'ToggleBitInSignal':
                                    if (c.signal)
                                        refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                    break;
                                case 'OpenScreen':
                                    if (c.screen)
                                        refactorings.push({ name: c.screen, itemType: 'screenName', target: BindingTarget.event, targetName: a[0], display: c.type + '/screen', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.screen = newValue });
                                    break;
                                case 'OpenDialog':
                                    if (c.screen)
                                        refactorings.push({ name: c.screen, itemType: 'screenName', target: BindingTarget.event, targetName: a[0], display: c.type + '/screen', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.screen = newValue });
                                    break;
                            }
                        }
                    }
                }
            }
        }
        return refactorings;
    }
    refactor(refactoring, oldValue, newValue) {
        refactoring.refactor(newValue);
        let scriptString = JSON.stringify(refactoring.sourceObject);
        refactoring.designItem.setAttribute(refactoring.targetName, scriptString);
    }
}
