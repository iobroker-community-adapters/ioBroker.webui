import { BindingTarget, PropertiesHelper } from "@node-projects/web-component-designer";
import { BaseCustomControl, webuiCustomControlSymbol } from "../runtime/CustomControls.js";
export class IobrokerWebuiRefactorService {
    getRefactorings(designItems) {
        let refactorings = [];
        for (let d of designItems) {
            if (d.element instanceof BaseCustomControl) {
                let cc = d.element.constructor[webuiCustomControlSymbol];
                if (cc) {
                    for (let p in cc.control.properties) {
                        const pdef = cc.control.properties[p];
                        if (pdef.type == 'signal') {
                            if (d.element[p]) {
                                refactorings.push({
                                    name: d.element[p], itemType: 'signal', target: BindingTarget.property, targetName: p, service: this, designItem: d, type: 'binding', sourceObject: pdef, display: 'property' + '/' + p, refactor: newValue => {
                                        d.element[p] = newValue; //TODO: set of property is not yet undoable, maybe we need this in designitem. Or designitem should set reste it?
                                        d.setAttribute(PropertiesHelper.camelToDashCase(p), newValue);
                                    }
                                });
                            }
                        }
                        else if (pdef.type == 'screen') {
                            if (d.element[p]) {
                                refactorings.push({
                                    name: d.element[p], itemType: 'screen', target: BindingTarget.property, targetName: p, service: this, designItem: d, type: 'binding', sourceObject: pdef, display: 'property' + '/' + p, refactor: newValue => {
                                        d.element[p] = newValue; //TODO: set of property is not yet undoable, maybe we need this in designitem. Or designitem should set reste it?
                                        d.setAttribute(PropertiesHelper.camelToDashCase(p), newValue);
                                    }
                                });
                            }
                        }
                        else if (pdef.type == 'string' || pdef.type == 'enum') {
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
    refactor(refactoring, oldValue, newValue) {
        refactoring.refactor(newValue);
    }
}
