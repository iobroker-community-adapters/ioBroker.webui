import { BindingTarget, IDesignItem, IRefactorService, IRefactoring, PropertiesHelper } from "@node-projects/web-component-designer";
import { BaseCustomControl, CustomControlInfo, webuiCustomControlSymbol } from "../runtime/CustomControls.js";

export class IobrokerWebuiRefactorService implements IRefactorService {
    getRefactorings(designItems: IDesignItem[]): (IRefactoring & { refactor: (newValue) => void })[] {
        let refactorings: (IRefactoring & { refactor: (newValue) => void })[] = [];
        for (let d of designItems) {
            if (d.element instanceof BaseCustomControl) {
                let cc = d.element.constructor[webuiCustomControlSymbol] as CustomControlInfo;
                if (cc) {
                    for (let p in cc.control.properties) {
                        const pdef = cc.control.properties[p];
                        if (pdef.type == 'signal') {
                            if (d.element[p]) {
                                refactorings.push({
                                    name: d.element[p], itemType: 'bindableObject', target: BindingTarget.property, targetName: p, service: this, designItem: d, type: 'binding', sourceObject: pdef, display: 'property' + '/' + p, refactor: newValue => {
                                        d.element[p] = newValue; //TODO: set of property is not yet undoable, maybe we need this in designitem. Or designitem should set reste it?
                                        d.setAttribute(PropertiesHelper.camelToDashCase(p), newValue);
                                    }
                                });
                            }
                        } else if (pdef.type == 'screen') {
                            if (d.element[p]) {
                                refactorings.push({
                                    name: d.element[p], itemType: 'screenName', target: BindingTarget.property, targetName: p, service: this, designItem: d, type: 'binding', sourceObject: pdef, display: 'property' + '/' + p, refactor: newValue => {
                                        d.element[p] = newValue; //TODO: set of property is not yet undoable, maybe we need this in designitem. Or designitem should set reste it?
                                        d.setAttribute(PropertiesHelper.camelToDashCase(p), newValue);
                                    }
                                });
                            }
                        } else if (pdef.type == 'string' || pdef.type == 'enum') {
                            if (d.element[p]) {
                                refactorings.push({
                                    name: d.element[p], itemType: 'text', target: BindingTarget.property, targetName: p, service: this, designItem: d, type: 'attribute', sourceObject: pdef, display: 'property' + '/' + p, refactor: newValue => {
                                        d.element[p] = newValue; //TODO: set of property is not yet undoable, maybe we need this in designitem. Or designitem should set reste it?
                                        d.setAttribute(PropertiesHelper.camelToDashCase(p), newValue);
                                    }
                                });
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
    }
}