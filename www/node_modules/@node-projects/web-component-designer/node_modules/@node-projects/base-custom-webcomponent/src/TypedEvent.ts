export interface Listener<T> {
    (event: T): any;
}

export interface Disposable {
    dispose();
}

export class PropertyChangedArgs<T> {
    constructor(newValue?: T, oldValue?: T) {
        this.newValue = newValue;
        this.oldValue = oldValue;
    }

    oldValue: T;
    newValue: T;
}

export class TypedEvent<T> {
    private listeners: Listener<T>[] = [];
    private listenersOncer: Listener<T>[] = [];
    private listenerSingle: Listener<T> = null;

    on = (listener: Listener<T>): Disposable => {
        this.listeners.push(listener);
        return {
            dispose: () => this.off(listener)
        };
    }

    single = (listener: Listener<T>): Disposable => {
        this.listenerSingle = listener;
        return {
            dispose: () => { if (this.listenerSingle === listener) this.listenerSingle = null }
        };
    }

    once = (listener: Listener<T>): void => {
        this.listenersOncer.push(listener);
    }

    off = (listener: Listener<T>) => {
        let callbackIndex = this.listeners.indexOf(listener);
        if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1);
    }

    emit = (event: T) => {
        this.listeners.forEach((listener) => listener(event));

        if (this.listenersOncer.length > 0) {
            const toCall = this.listenersOncer;
            this.listenersOncer = [];
            toCall.forEach(listener => listener(event));
        }
        if (this.listenerSingle) {
            this.listenerSingle(event);
        }
    }

    pipe = (te: TypedEvent<T>): Disposable => {
        return this.on((e) => te.emit(e));
    }
}