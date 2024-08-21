//File not imported anywhere, only for global types wich are usable from scripts!
//TODO: this file should be generated or checked. It could get out of sync easyly

type StateValue = string | number | boolean | null;
interface State {
    /** The value of the state. */
    val: StateValue;

    /** Direction flag: false for desired value and true for actual value. Default: false. */
    ack: boolean;

    /** Unix timestamp. Default: current time */
    ts: number;

    /** Unix timestamp of the last time the value changed */
    lc: number;

    /** Name of the adapter instance which set the value, e.g. "system.adapter.web.0" */
    from: string;

    /** The user who set this value */
    user?: string;
}
type iobObjectType =
    | 'state'
    | 'channel'
    | 'device'
    | 'folder'
    | 'enum'
    | 'adapter'
    | 'config'
    | 'group'
    | 'host'
    | 'instance'
    | 'meta'
    | 'script'
    | 'user'
    | 'chart'
    | 'schedule'
    | 'design';

var IOB: {
    getState(id: string): Promise<State>;
    setState(id: string, val: State | StateValue, ack?: boolean): Promise<void>;
    subscribeState(id: string, cb: ioBroker.StateChangeHandler): Promise<void>;
    unsubscribeState(id: string, cb: ioBroker.StateChangeHandler): void;
    getObject(id: string): Promise<any>;
    getObjectList(type: iobObjectType, id: string): Promise<Record<string, any>>
    sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm' | 'uiConnected' | 'uiChangedView', data?: string): Promise<void>;
};

var RUNTIME: {
    openScreen(config: {
        /**
         * Name of the Screen
         */
        screen: string;
        /**
         * If signals in screen are defined relative (starting with a '.'), this will be prepended
         */
        relativeSignalsPath?: string;
        noHistory?: boolean;
    }): Promise<void>;
    openDialog(config: {
        /**
         * Name of the Screen
         */
        screen: string;
        title?: string;
        /**
         * If signals in screen are defined relative (starting with a '.'), this will be prepended
         */
        relativeSignalsPath?: string;
        moveable?: boolean;
        closeable?: boolean;

        width?: string;
        height?: string;

        left?: string;
        top?: string;
    }): Promise<void>

    getParentScreen(screen: BaseScreenViewerAndControl): BaseScreenViewerAndControl;

    findParent<T>(element: Element, type: new (...args: any[]) => T, predicate?: (element: Element) => boolean): T;
}

interface BaseScreenViewerAndControl extends HTMLElement {
    'constructor': {
        style: CSSStyleSheet;
        template: HTMLTemplateElement;
    } & Function;

    shadowRoot: ShadowRoot;
    _waitForChildrenReady();
    _getDomElement<T extends Element>(id: string): T;
    _getDomElements<T extends Element>(selector: string): T[];
    _assignEvent(event: string, callback: (...args) => void): { remove: () => void };
    _getRelativeSignalsPath(): string;
}

interface ScreenViewer extends BaseScreenViewerAndControl {
    screenName: string;
    relativeSignalsPath: string;
}

interface BaseCustomControl extends BaseScreenViewerAndControl {
}

var BaseCustomControl = BaseCustomControl;
var ScreenViewer = ScreenViewer;