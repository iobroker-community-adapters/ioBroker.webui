import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
import { ScriptCommands } from "./ScriptCommands.js";
import { ScriptMultiplexValue } from "./ScriptValue.js";
import Long from 'long'

export class ScriptSystem {
    static async execute(scriptCommands: ScriptCommands[], context: { event: Event, element: Element }) {
        for (let c of scriptCommands) {
            switch (c.type) {
                case 'OpenScreen': {
                    if (!c.openInDialog) {
                        if (c.noHistory) {
                            (<ScreenViewer>document.getElementById('viewer')).relativeSignalsPath = c.relativeSignalsPath;
                            (<ScreenViewer>document.getElementById('viewer')).screenName = ScriptSystem.getValue(c.screen, context);
                        } else {
                            let hash = 'screenName=' + ScriptSystem.getValue(c.screen, context);
                            window.location.hash = hash;
                        }
                    } else {
                        let sv = new ScreenViewer();
                        sv.relativeSignalsPath = c.relativeSignalsPath;
                        sv.screenName = ScriptSystem.getValue(c.screen, context);
                    }
                    break;
                }
                case 'OpenUrl': {
                    window.open(c.url, c.target);
                    break;
                }

                case 'ToggleSignalValue': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, !state.val);
                    break;
                }
                case 'SetSignalValue': {
                    await iobrokerHandler.connection.setState(c.signal, ScriptSystem.getValue(c.value, context));
                    break;
                }
                case 'IncrementSignalValue': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, state.val + ScriptSystem.getValue(c.value, context));
                    break;
                }
                case 'DecrementSignalValue': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    await iobrokerHandler.connection.setState(c.signal, <any>state.val - ScriptSystem.getValue(c.value, context));
                    break;
                }

                case 'SetBitInSignal': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    const newVal = Long.fromNumber(<number>state.val).or(mask).toNumber();
                    await iobrokerHandler.connection.setState(c.signal, newVal);
                    break;
                }
                case 'ClearBitInSignal': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    mask.negate();
                    const newVal = Long.fromNumber(<number>state.val).and(mask).toNumber();
                    await iobrokerHandler.connection.setState(c.signal, newVal);
                    break;
                }
                case 'ToggleBitInSignal': {
                    let state = await iobrokerHandler.connection.getState(c.signal);
                    let mask = Long.fromNumber(1).shiftLeft(c.bitNumber);
                    const newVal = Long.fromNumber(<number>state.val).xor(mask).toNumber();
                    await iobrokerHandler.connection.setState(c.signal, newVal);
                    break;
                }

                case 'Javascript': {
                    var context: { event: Event, element: Element } = context; // make context accessible from script
                    (<any>context).shadowRoot = (<ShadowRoot>context.element.getRootNode());
                    eval(c.script);
                    break;
                }

                case 'SetElementProperty': {
                    let host = (<ShadowRoot>context.element.getRootNode()).host;
                    if (c.targetSelectorTarget == 'parentScreen')
                        host = (<ShadowRoot>host.getRootNode()).host;
                    let elements: Iterable<Element> = [host];
                    if (c.targetSelector)
                        elements = host.shadowRoot.querySelectorAll(c.targetSelector);
                    for (let e of elements) {
                        if (c.target == 'attribute') {
                            e.setAttribute(c.name, c.value);
                        } else if (c.target == 'property') {
                            e[c.name] = c.value;
                        } else if (c.target == 'css') {
                            (<HTMLElement>e).style[c.name] = c.value;
                        }
                    }
                }
            }
        }
    }

    static getValue(value: string | number | boolean | ScriptMultiplexValue, context: any): any {
        return value;
    }
}