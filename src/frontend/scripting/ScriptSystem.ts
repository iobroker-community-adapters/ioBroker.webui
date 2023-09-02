import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
import { Script } from "./Script.js";
import { ScriptCommands } from "./ScriptCommands.js";
import { ScriptMultiplexValue } from "./ScriptValue.js";
import Long from 'long'

export class ScriptSystem {
    static async execute(scriptCommands: ScriptCommands[], outerContext: { event: Event, element: Element, root: HTMLElement }) {
        for (let c of scriptCommands) {
            switch (c.type) {
                case 'OpenScreen': {
                    const screen = await ScriptSystem.getValue(c.screen, outerContext);
                    if (!c.openInDialog) {
                        if (c.noHistory) {
                            (<ScreenViewer>document.getElementById('viewer')).relativeSignalsPath = c.relativeSignalsPath;
                            (<ScreenViewer>document.getElementById('viewer')).screenName = screen;
                        } else {
                            let hash = 'screenName=' + screen;
                            window.location.hash = hash;
                        }
                    } else {
                        let sv = new ScreenViewer();
                        sv.relativeSignalsPath = c.relativeSignalsPath;
                        sv.screenName = screen;
                    }
                    break;
                }
                case 'OpenUrl': {
                    window.open(c.url, c.target);
                    break;
                }

                case 'ToggleSignalValue': {
                    const signal = await ScriptSystem.getValue(c.signal, outerContext);
                    let state = await iobrokerHandler.connection.getState(signal);
                    await iobrokerHandler.connection.setState(signal, !state?.val);
                    break;
                }
                case 'SetSignalValue': {
                    const signal = await ScriptSystem.getValue(c.signal, outerContext);
                    await iobrokerHandler.connection.setState(signal, await ScriptSystem.getValue(c.value, outerContext));
                    break;
                }
                case 'IncrementSignalValue': {
                    const signal = await ScriptSystem.getValue(c.signal, outerContext);
                    let state = await iobrokerHandler.connection.getState(signal);
                    await iobrokerHandler.connection.setState(signal, state.val + await ScriptSystem.getValue(c.value, outerContext));
                    break;
                }
                case 'DecrementSignalValue': {
                    const signal = await ScriptSystem.getValue(c.signal, outerContext);
                    let state = await iobrokerHandler.connection.getState(signal);
                    await iobrokerHandler.connection.setState(signal, <any>state.val - await ScriptSystem.getValue(c.value, outerContext));
                    break;
                }

                case 'SetBitInSignal': {
                    const signal = await ScriptSystem.getValue(c.signal, outerContext);
                    let state = await iobrokerHandler.connection.getState(signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    const newVal = Long.fromNumber(<number>state.val).or(mask).toNumber();
                    await iobrokerHandler.connection.setState(signal, newVal);
                    break;
                }
                case 'ClearBitInSignal': {
                    const signal = await ScriptSystem.getValue(c.signal, outerContext);
                    let state = await iobrokerHandler.connection.getState(signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    mask.negate();
                    const newVal = Long.fromNumber(<number>state.val).and(mask).toNumber();
                    await iobrokerHandler.connection.setState(signal, newVal);
                    break;
                }
                case 'ToggleBitInSignal': {
                    const signal = await ScriptSystem.getValue(c.signal, outerContext);
                    let state = await iobrokerHandler.connection.getState(signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    const newVal = Long.fromNumber(<number>state.val).xor(mask).toNumber();
                    await iobrokerHandler.connection.setState(signal, newVal);
                    break;
                }

                case 'Javascript': {
                    const script = await ScriptSystem.getValue(c.script, outerContext);
                    var context: { event: Event, element: Element } = outerContext; // make context accessible from script
                    (<any>context).shadowRoot = (<ShadowRoot>context.element.getRootNode());
                    eval(script);
                    break;
                }

                case 'SetElementProperty': {
                    const name = await ScriptSystem.getValue(c.name, outerContext);
                    const value = await ScriptSystem.getValue(c.value, outerContext);
                    let host = (<ShadowRoot>outerContext.element.getRootNode()).host;
                    if (c.targetSelectorTarget == 'currentElement')
                        host = outerContext.element;
                    else if (c.targetSelectorTarget == 'parentElement')
                        host = outerContext.element.parentElement;
                    else if (c.targetSelectorTarget == 'parentScreen')
                        host = (<ShadowRoot>host.getRootNode()).host;
                    let elements: Iterable<Element> = [host];
                    if (c.targetSelector)
                        elements = host.shadowRoot.querySelectorAll(c.targetSelector);
                    for (let e of elements) {
                        if (c.target == 'attribute') {
                            e.setAttribute(name, value);
                        } else if (c.target == 'property') {
                            e[name] = value;
                        } else if (c.target == 'css') {
                            (<HTMLElement>e).style[name] = value;
                        }
                    }
                }
            }
        }
    }

    static async getValue(value: string | number | boolean | ScriptMultiplexValue, outerContext: { event: Event, element: Element, root: HTMLElement }): Promise<any> {
        if (typeof value === 'object') {
            switch ((<ScriptMultiplexValue>value).source) {
                case 'property': {
                    return outerContext.root[(<ScriptMultiplexValue>value).name];
                }
                case 'signal': {
                    let sng = await iobrokerHandler.connection.getState((<ScriptMultiplexValue>value).name);
                    return sng.val;
                }
            }
        }
        return value;
    }

    static async assignAllScripts(javascriptCode: string, shadowRoot: ShadowRoot, instance: HTMLElement) {
        const allElements = shadowRoot.querySelectorAll('*');
        let jsObject: any = null;
        if (javascriptCode) {
            try {
                const scriptUrl = URL.createObjectURL(new Blob([javascriptCode], { type: 'application/javascript' }));
                //@ts-ignore
                jsObject = await importShim(scriptUrl);
                if (jsObject.init) {
                    jsObject.init(instance);
                }
            } catch (err) {
                console.warn('error parsing javascript', err)
            }
        }
        for (let e of allElements) {
            for (let a of e.attributes) {
                if (a.name[0] == '@') {
                    try {
                        let evtName = a.name.substring(1);
                        let script = a.value.trim();
                        if (script[0] == '{') {
                            let scriptObj: Script = JSON.parse(script);
                            e.addEventListener(evtName, (evt) => ScriptSystem.execute(scriptObj.commands, { event: evt, element: e, root: instance }));
                        } else {
                            e.addEventListener(evtName, (evt) => {
                                if (!jsObject[script])
                                    console.warn('javascritp function named: ' + script + ' not found, maybe missing a "export" ?');
                                else
                                    jsObject[script](evt, e, shadowRoot);
                            });
                        }
                    }
                    catch (err) {
                        console.warn('error assigning script', e, a);
                    }
                }
            }
        }
    }
}