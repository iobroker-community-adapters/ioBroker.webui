import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { ScreenViewer } from "../runtime/ScreenViewer.js";
import { Script } from "./Script.js";
import { ScriptCommands } from "./ScriptCommands.js";
import { IScriptMultiplexValue } from "../interfaces/IScriptMultiplexValue.js";
import { sleep } from "../helper/Helper.js";
import { ICustomControlScript } from "../interfaces/ICustomControlScript.js";
import { IoBrokerWebuiDialog } from "../helper/DialogHelper.js";
import { generateEventCodeFromBlockly } from "../config/blockly/IobrokerWebuiBlocklyJavascriptHelper.js";
import Long from 'long'
import { parseBindingString } from "../helper/IobrokerWebuiBindingsHelper.js";

export class ScriptSystem {

    static async execute(scriptCommands: ScriptCommands[], outerContext: { event: Event, element: Element, root: HTMLElement }) {
        for (let c of scriptCommands) {
            ScriptSystem.runScriptCommand(c, outerContext);
        }
    }

    static async runScriptCommand<T extends ScriptCommands>(command: T, context) {
        switch (command.type) {
            case 'OpenScreen': {
                const screen = await ScriptSystem.getValue(command.screen, context);
                if (command.noHistory) {
                    (<ScreenViewer>document.getElementById('viewer')).relativeSignalsPath = await ScriptSystem.getValue(command.relativeSignalsPath, context);
                    (<ScreenViewer>document.getElementById('viewer')).screenName = screen;
                } else {
                    let hash = 'screenName=' + screen;
                    window.location.hash = hash;
                }
                break;
            }

            case 'OpenDialog': {
                const screen = await ScriptSystem.getValue(command.screen, context);
                const title = await ScriptSystem.getValue(command.title, context);
                const moveable = await ScriptSystem.getValue(command.moveable, context);
                const closeable = await ScriptSystem.getValue(command.closeable, context);

                let width = await ScriptSystem.getValue(command.width, context);
                let height = await ScriptSystem.getValue(command.height, context);
                const left = await ScriptSystem.getValue(command.left, context);
                const top = await ScriptSystem.getValue(command.top, context);

                let sv = new ScreenViewer();
                sv.relativeSignalsPath = command.relativeSignalsPath;
                sv.screenName = screen;
                if (!width)
                    width = await (await iobrokerHandler.getWebuiObject('screen', screen)).settings.width;
                if (!height)
                    height = await (await iobrokerHandler.getWebuiObject('screen', screen)).settings.height
                IoBrokerWebuiDialog.openDialog({ title, content: sv, moveable, closeable, width, height, top, left });
                break;
            }

            case 'CloseDialog': {
                //const dialogdId = await ScriptSystem.getValue(c.dialogId, outerContext);
                IoBrokerWebuiDialog.closeDialog({ element: <HTMLElement>context.element });
                break;
            }

            case 'OpenUrl': {
                window.open(await ScriptSystem.getValue(command.url, context), command.target);
                break;
            }

            case 'Delay': {
                const value = await ScriptSystem.getValue(command.value, context);
                await sleep(value)
                break;
            }

            case 'Console': {
                const target = await ScriptSystem.getValue(command.target, context);
                const message = await ScriptSystem.getValue(command.message, context);
                console[target](message);
                break;
            }

            case 'SwitchLanguage': {
                const language = await ScriptSystem.getValue(command.language, context);
                iobrokerHandler.language = language;
                break;
            }

            case 'ToggleSignalValue': {
                const signal = await ScriptSystem.getValue(command.signal, context);
                let state = await iobrokerHandler.connection.getState(signal);
                await iobrokerHandler.connection.setState(signal, !state?.val);
                break;
            }
            case 'SetSignalValue': {
                const signal = await ScriptSystem.getValue(command.signal, context);
                await iobrokerHandler.connection.setState(signal, await ScriptSystem.getValue(command.value, context));
                break;
            }
            case 'IncrementSignalValue': {
                const signal = await ScriptSystem.getValue(command.signal, context);
                let state = await iobrokerHandler.connection.getState(signal);
                await iobrokerHandler.connection.setState(signal, state.val + await ScriptSystem.getValue(command.value, context));
                break;
            }
            case 'DecrementSignalValue': {
                const signal = await ScriptSystem.getValue(command.signal, context);
                let state = await iobrokerHandler.connection.getState(signal);
                await iobrokerHandler.connection.setState(signal, <any>state.val - await ScriptSystem.getValue(command.value, context));
                break;
            }
            case 'CalculateSignalValue': {
                const formula = await ScriptSystem.getValue(command.formula, context);
                const targetSignal = await ScriptSystem.getValue(command.targetSignal, context);
                let parsed = parseBindingString(formula);
                let results = await Promise.all(parsed.signals.map(x => iobrokerHandler.getState(x)));
                let nm = '';
                for (let i = 0; i < parsed.parts.length - 1; i++) {
                    let v = results[i].val;
                    if (v == null)
                        return;
                    nm += v + parsed.parts[i + 1];
                }
                let result = eval(nm);
                await iobrokerHandler.connection.setState(targetSignal, result);
                break;
            }

            case 'SetBitInSignal': {
                const signal = await ScriptSystem.getValue(command.signal, context);
                let state = await iobrokerHandler.connection.getState(signal);
                let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
                const newVal = Long.fromNumber(<number>state.val).or(mask).toNumber();
                await iobrokerHandler.connection.setState(signal, newVal);
                break;
            }
            case 'ClearBitInSignal': {
                const signal = await ScriptSystem.getValue(command.signal, context);
                let state = await iobrokerHandler.connection.getState(signal);
                let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
                mask.negate();
                const newVal = Long.fromNumber(<number>state.val).and(mask).toNumber();
                await iobrokerHandler.connection.setState(signal, newVal);
                break;
            }
            case 'ToggleBitInSignal': {
                const signal = await ScriptSystem.getValue(command.signal, context);
                let state = await iobrokerHandler.connection.getState(signal);
                let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
                const newVal = Long.fromNumber(<number>state.val).xor(mask).toNumber();
                await iobrokerHandler.connection.setState(signal, newVal);
                break;
            }

            case 'Javascript': {
                const script = await ScriptSystem.getValue(command.script, context);
                let mycontext: { event: Event, element: Element } = context;
                (<any>mycontext).shadowRoot = (<ShadowRoot>context.element.getRootNode());
                (<any>mycontext).instance = (<any>context).shadowRoot.host;
                if (!(<any>command).compiledScript)
                    (<any>command).compiledScript = new Function('context', script);
                (<any>command).compiledScript(mycontext);
                break;
            }

            case 'SetElementProperty': {
                const name = await ScriptSystem.getValue(command.name, context);
                const value = await ScriptSystem.getValue(command.value, context);
                let host = (<ShadowRoot>context.element.getRootNode()).host;
                if (command.targetSelectorTarget == 'currentElement')
                    host = context.element;
                else if (command.targetSelectorTarget == 'parentElement')
                    host = context.element.parentElement;
                else if (command.targetSelectorTarget == 'parentScreen')
                    host = (<ShadowRoot>host.getRootNode()).host;
                let elements: Iterable<Element> = [host];
                if (command.targetSelector)
                    elements = host.shadowRoot.querySelectorAll(command.targetSelector);
                for (let e of elements) {
                    if (command.target == 'attribute') {
                        e.setAttribute(name, value);
                    } else if (command.target == 'property') {
                        e[name] = value;
                    } else if (command.target == 'css') {
                        (<HTMLElement>e).style[name] = value;
                    }
                }
                break;
            }

            case 'IobrokerSendTo': {
                const instance = await ScriptSystem.getValue(command.instance, context);
                const mycommand = await ScriptSystem.getValue(command.command, context);
                const data = await ScriptSystem.getValue(command.data, context);
                await iobrokerHandler.connection.sendTo(instance, mycommand, data);
                break;
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
                case 'event': {
                    let obj = outerContext.event;
                    if ((<IScriptMultiplexValue>value).name)
                        obj = ScriptSystem.extractPart(obj, (<IScriptMultiplexValue>value).name);
                    return obj;
                }
            }
        }
        return value;
    }

    static extractPart(obj: any, propertyPath: string) {
        let retVal = obj;
        for (let p of propertyPath.split('.')) {
            retVal = retVal?.[p];
        }
        return retVal;
    }

    static async assignAllScripts(source: string, javascriptCode: string, shadowRoot: ShadowRoot, instance: HTMLElement): Promise<ICustomControlScript> {
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
                console.error('error parsing javascript - ' + source, err)
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
                                let compiledFunc: Awaited<ReturnType<typeof generateEventCodeFromBlockly>> = null;
                                e.addEventListener(evtName, async (evt) => {
                                    if (!compiledFunc)
                                        compiledFunc = await generateEventCodeFromBlockly(scriptObj);
                                    compiledFunc(evt, shadowRoot);
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