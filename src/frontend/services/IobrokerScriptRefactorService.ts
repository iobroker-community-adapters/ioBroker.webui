import { BindingTarget, IDesignItem, IRefactorService, IRefactoring } from "@node-projects/web-component-designer";
import { Script } from "../scripting/Script";
import { IScriptMultiplexValue } from "../interfaces/IScriptMultiplexValue";

export class IobrokerScriptRefactorService implements IRefactorService {
    getRefactorings(designItems: IDesignItem[]): (IRefactoring & { refactor: (newValue) => void })[] {
        let refactorings: (IRefactoring & { refactor: (newValue) => void })[] = [];
        for (let d of designItems) {
            for (let a of d.attributes()) {
                if (a[0][0] == '@') {
                    let sc = a[1];
                    if (sc[0] == '{') {
                        let script = JSON.parse(sc) as Script;
                        for (let c of script.commands) {
                            for (let p in c) {
                                let cp = c[p];
                                if (typeof cp === 'object') {
                                    let mp = cp as IScriptMultiplexValue;
                                    if (mp.source == 'signal') {
                                        refactorings.push({ name: mp.name, target: BindingTarget.event, targetName: a[0], service: this, designItem: d, type: 'script', sourceObject: script, display: 'complex for property: ' + p + ' in command ' + c.type, refactor: newValue => mp.name = newValue });
                                    }
                                }
                            }
                            switch (c.type) {
                                case 'SetSignalValue':
                                    refactorings.push({ name: c.signal, target: BindingTarget.event, targetName: a[0], display: 'signal in command ' + c.type, service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                    break;
                                case 'ToggleSignalValue':
                                    refactorings.push({ name: c.signal, target: BindingTarget.event, targetName: a[0], display: 'signal in command ' + c.type, service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                    break;
                                case 'IncrementSignalValue':
                                    refactorings.push({ name: c.signal, target: BindingTarget.event, targetName: a[0], display: 'signal in command ' + c.type, service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                    break;
                                case 'DecrementSignalValue':
                                    refactorings.push({ name: c.signal, target: BindingTarget.event, targetName: a[0], display: 'signal in command ' + c.type, service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                    break;
                                case 'SetBitInSignal':
                                    refactorings.push({ name: c.signal, target: BindingTarget.event, targetName: a[0], display: 'signal in command ' + c.type, service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                    break;
                                case 'ClearBitInSignal':
                                    refactorings.push({ name: c.signal, target: BindingTarget.event, targetName: a[0], display: 'signal in command ' + c.type, service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                    break;
                                case 'ToggleBitInSignal':
                                    refactorings.push({ name: c.signal, target: BindingTarget.event, targetName: a[0], display: 'signal in command ' + c.type, service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                    break;
                            }
                        }
                    }

                }
            }
        }
        return refactorings;
    }

    refactor(refactoring: (IRefactoring & { refactor: (newValue) => void }), oldValue: string, newValue: string) {
        refactoring.refactor(newValue);
        let scriptString = JSON.stringify(refactoring.sourceObject);
        refactoring.designItem.setAttribute(refactoring.targetName, scriptString);
    }
}