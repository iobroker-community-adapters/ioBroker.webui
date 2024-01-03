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

var iobrokerHandler: {
    getState(id: string): Promise<State>;
    setState(id: string, val: State | StateValue, ack?: boolean): Promise<void>;
    sendCommand(command: 'addNpm' | 'removeNpm' | 'updateNpm' | 'uiConnected' | 'uiChangedView', data?: string): Promise<void>;
};

var runtime: {
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
}
