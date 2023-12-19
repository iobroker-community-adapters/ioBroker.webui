import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
import { Script } from "./Script.js";
import { ScriptCommands } from "./ScriptCommands.js";
import { IScriptMultiplexValue } from "../interfaces/IScriptMultiplexValue.js";
import Long from 'long'
import { sleep } from "../helper/Helper.js";
import { ICustomControlScript } from "../interfaces/ICustomControlScript.js";
import { IoBrokerWebuiDialog } from "../helper/DialogHelper.js";
import { generateEventCodeFromBlockly } from "../config/blockly/IobrokerWebuiBlocklyJavascriptHelper.js";

export class ScriptSystem {
    static async execute(scriptCommands: ScriptCommands[], outerContext: { event: Event, element: Element, root: HTMLElement }) {
        for (let c of scriptCommands) {
            switch (c.type) {
                case 'OpenScreen': {
                    const screen = await ScriptSystem.getValue(c.screen, outerContext);
                    if (c.noHistory) {
                        (<ScreenViewer>document.getElementById('viewer')).relativeSignalsPath = await ScriptSystem.getValue(c.relativeSignalsPath, outerContext);
                        (<ScreenViewer>document.getElementById('viewer')).screenName = screen;
                    } else {
                        let hash = 'screenName=' + screen;
                        window.location.hash = hash;
                    }
                    break;
                }

                case 'OpenDialog': {
                    const screen = await ScriptSystem.getValue(c.screen, outerContext);
                    const title = await ScriptSystem.getValue(c.title, outerContext);
                    const moveable = await ScriptSystem.getValue(c.moveable, outerContext);
                    const closeable = await ScriptSystem.getValue(c.closeable, outerContext);

                    let width = await ScriptSystem.getValue(c.width, outerContext);
                    let height = await ScriptSystem.getValue(c.height, outerContext);
                    const left = await ScriptSystem.getValue(c.left, outerContext);
                    const top = await ScriptSystem.getValue(c.top, outerContext);

                    let sv = new ScreenViewer();
                    sv.relativeSignalsPath = c.relativeSignalsPath;
                    sv.screenName = screen;
                    if (!width)
                        width = await (await iobrokerHandler.getScreen(screen)).settings.width;
                    if (!height)
                        height = await (await iobrokerHandler.getScreen(screen)).settings.height
                    IoBrokerWebuiDialog.openDialog({ title, content: sv, moveable, closeable, width, height, top, left });
                    break;
                }

                case 'CloseDialog': {
                    //const dialogdId = await ScriptSystem.getValue(c.dialogId, outerContext);

                    IoBrokerWebuiDialog.closeDialog({ element: <HTMLElement>outerContext.element });
                    break;
                }

                case 'OpenUrl': {
                    window.open(await ScriptSystem.getValue(c.url, outerContext), c.target);
                    break;
                }

                case 'Delay': {
                    const value = await ScriptSystem.getValue(c.value, outerContext);
                    await sleep(value)
                    break;
                }

                case 'SwitchLanguage': {
                    const language = await ScriptSystem.getValue(c.language, outerContext);
                    iobrokerHandler.language = language;
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
                    let context: { event: Event, element: Element } = outerContext; // make context accessible from script
                    (<any>context).shadowRoot = (<ShadowRoot>context.element.getRootNode());
                    (<any>context).instance = (<any>context).shadowRoot.host;
                    if (!(<any>c).compiledScript)
                        (<any>c).compiledScript = new Function('context', script);
                    (<any>c).compiledScript();
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
                    break;
                }

                case 'IobrokerSendTo': {
                    const instance = await ScriptSystem.getValue(c.instance, outerContext);
                    const command = await ScriptSystem.getValue(c.command, outerContext);
                    const data = await ScriptSystem.getValue(c.data, outerContext);
                    await iobrokerHandler.connection.sendTo(instance, command, data);
                    break;
                }

            }
        }
    }

    static async getValue<T>(value: string | number | boolean | IScriptMultiplexValue, outerContext: { event: Event, element: Element, root: HTMLElement }): Promise<any> {
        if (typeof value === 'object') {
            switch ((<IScriptMultiplexValue>value).source) {
                case 'property': {
                    return outerContext.root[(<IScriptMultiplexValue>value).name];
                }
                case 'signal': {
                    let sng = await iobrokerHandler.connection.getState((<IScriptMultiplexValue>value).name);
                    return sng.val;
                }
            }
        }
        return value;
    }

    static async assignAllScripts(javascriptCode: string, shadowRoot: ShadowRoot, instance: HTMLElement): Promise<ICustomControlScript> {
        const allElements = shadowRoot.querySelectorAll('*');
        let jsObject: ICustomControlScript = null;
        if (javascriptCode) {
            try {
                const scriptUrl = URL.createObjectURL(new Blob([javascriptCode], { type: 'application/javascript' }));
                jsObject = await importShim(scriptUrl);
                if (jsObject.init) {
                    jsObject.init(instance);
                }
            } catch (err) {
                console.error('error parsing javascript', err)
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
                            if ('commands' in scriptObj) {
                                e.addEventListener(evtName, (evt) => ScriptSystem.execute(scriptObj.commands, { event: evt, element: e, root: instance }));
                            } else if ('blocks' in scriptObj) {
                                let compiledFunc = null;
                                e.addEventListener(evtName, async (evt) => {
                                    if (!compiledFunc)
                                        compiledFunc = await generateEventCodeFromBlockly(scriptObj);
                                    compiledFunc(evt);
                                });
                            }
                        } else {
                            e.addEventListener(evtName, (evt) => {
                                if (!jsObject[script])
                                    console.warn('javascritp function named: ' + script + ' not found, maybe missing a "export" ?');
                                else
                                    jsObject[script](evt, e, shadowRoot, instance);
                            });
                        }
                    }
                    catch (err) {
                        console.warn('error assigning script', e, a);
                    }
                }
            }
        }

        return jsObject;
    }
}