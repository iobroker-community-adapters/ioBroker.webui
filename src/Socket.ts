/*!
 * ioBroker WebSockets
 * Copyright 2020, bluefox <dogafox@gmail.com>
 * Released under the MIT License.
 * v 0.2.1 (2020_10_16)
 */
/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */

const MESSAGE_TYPES = {
    MESSAGE: 0,
    PING: 1,
    PONG: 2,
    CALLBACK: 3
};

const DEBUG = true;

const ERRORS: { [code: number]: string } = {
    1000: 'CLOSE_NORMAL',	        // Successful operation / regular socket shutdown
    1001: 'CLOSE_GOING_AWAY',	    // Client is leaving (browser tab closing)
    1002: 'CLOSE_PROTOCOL_ERROR',	// Endpoint received a malformed frame
    1003: 'CLOSE_UNSUPPORTED',		// Endpoint received an unsupported frame (e.g. binary-only endpoint received text frame)
    1005: 'CLOSED_NO_STATUS',		// Expected close status, received none
    1006: 'CLOSE_ABNORMAL',		    // No close code frame has been received
    1007: 'Unsupported payload',	// Endpoint received inconsistent message (e.g. malformed UTF-8)
    1008: 'Policy violation',	    // Generic code used for situations other than 1003 and 1009
    1009: 'CLOSE_TOO_LARGE',	    // Endpoint won't process large frame
    1010: 'Mandatory extension',	// Client wanted an extension which server did not negotiate
    1011: 'Server error',	        // Internal server error while operating
    1012: 'Service restart',	    // Server/service is restarting
    1013: 'Try again later',	    // Temporary server condition forced blocking client's request
    1014: 'Bad gateway	Server',    // acting as gateway received an invalid response
    1015: 'TLS handshake fail',		// Transport Layer Security handshake failure
};

// possible events: connect, disconnect, reconnect, error, connect_error
export class SocketClient {
    public handlers: { [name: string]: ((...args: any) => void)[] } = {};
    public lastPong: number = 0;
    public socket: WebSocket | null = null;
    public wasConnected = false;
    public connectTimer: NodeJS.Timeout | null = null;
    public connectingTimer: NodeJS.Timeout | null = null;
    public connectionCount = 0;
    public callbacks: { id: number, cb: () => void, ts: number }[] = [];
    private pending: [name: string, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any][] = []; // pending requests till connection established
    public url?: string = undefined;
    public options?: { name?: string };
    public pingInterval: NodeJS.Timeout | null = null;
    public id: number = 0;
    public sessionID?: number = undefined;
    public authTimeout: NodeJS.Timeout | null = null;
    public connected = false; // simulate socket.io interface

    log = {
        debug: (text: any) => DEBUG && console.log(`[${new Date().toISOString()}] ${text}`),
        warn: (text: any) => console.warn(`[${new Date().toISOString()}] ${text}`),
        error: (text: any) => console.error(`[${new Date().toISOString()}] ${text}`),
    };

    connect(_url: string, _options?: { name?: string }) {
        this.log.debug('Try to connect');
        this.id = 0;
        this.connectTimer && clearInterval(this.connectTimer);
        this.connectTimer = null;

        this.url = this.url || _url || window.location.href;
        this.options = this.options || _options;
        this.sessionID = Date.now();
        try {
            if (this.url === '/') {
                this.url = window.location.protocol + '//' + window.location.host + '/';
            }

            let u = this.url.replace(/^http/, 'ws').split('?')[0] + '?sid=' + this.sessionID;
            if (_options && _options.name) {
                u += '&name=' + encodeURIComponent(_options.name);
            }
            // "ws://www.example.com/socketserver"
            this.socket = new WebSocket(u);
        } catch (error) {
            this.handlers.error && this.handlers.error.forEach(cb => cb.call(this, error));
            return this.close();
        }

        this.connectingTimer = setTimeout(() => {
            this.connectingTimer = null;
            this.log.warn('No READY flag received in 3 seconds. Re-init');
            this.close(); // re-init connection, because no ___ready___ received in 2000 ms
        }, 3000);

        this.socket.onopen = () => {
            this.lastPong = Date.now();
            this.connectionCount = 0;

            this.pingInterval = setInterval(() => {
                if (Date.now() - this.lastPong > 5000) {
                    (<WebSocket>this.socket).send(JSON.stringify([MESSAGE_TYPES.PING]));
                }
                if (Date.now() - this.lastPong > 15000) {
                    this.close();
                }
                this._garbageCollect();
            }, 5000);
        };

        this.socket.onclose = event => {
            if (event.code === 3001) {
                this.log.warn('ws closed');
            } else {
                this.log.error('ws connection error: ' + ERRORS[event.code]);
            }
            this.close();
        };

        this.socket.onerror = error => {
            if (this.connected) {
                if ((<WebSocket>this.socket).readyState === 1) {
                    this.log.error('ws normal error: ' + error.type);
                }
                this.handlers.error && this.handlers.error.forEach(cb => cb.call(this, ERRORS[(<any>error).code] || 'UNKNOWN'));
            }
            this.close();
        };

        this.socket.onmessage = message => {
            this.lastPong = Date.now();
            if (!message || !message.data || typeof message.data !== 'string') {
                return console.error('Received invalid message: ' + JSON.stringify(message));
            }
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (e) {
                return console.error('Received invalid message: ' + JSON.stringify(message.data));
            }

            const [type, id, name, args] = data;

            if (this.authTimeout) {
                clearTimeout(this.authTimeout);
                this.authTimeout = null;
            }

            if (type === MESSAGE_TYPES.CALLBACK) {
                this.findAnswer(id, args);
            } else
                if (type === MESSAGE_TYPES.MESSAGE) {
                    if (name === '___ready___') {
                        this.connected = true;

                        if (this.wasConnected) {
                            this.handlers.reconnect && this.handlers.reconnect.forEach(cb => cb.call(this, true));
                        } else {
                            this.handlers.connect && this.handlers.connect.forEach(cb => cb.call(this, true));
                            this.wasConnected = true;
                        }

                        this.connectingTimer && clearTimeout(this.connectingTimer);
                        this.connectingTimer = null;

                        // resend all pending requests
                        if (this.pending.length) {
                            this.pending.forEach(([name, arg1, arg2, arg3, arg4, arg5]) =>
                                this.emit(name, arg1, arg2, arg3, arg4, arg5));

                            this.pending = [];
                        }

                    } else if (args) {
                        this.handlers[name] && this.handlers[name].forEach(cb => cb.call(this, args[0], args[1], args[2], args[3], args[4]));
                    } else {
                        this.handlers[name] && this.handlers[name].forEach(cb => cb.call(this));
                    }
                } else if (type === MESSAGE_TYPES.PING) {
                    (<WebSocket>this.socket).send(JSON.stringify([MESSAGE_TYPES.PONG]));
                } else if (type === MESSAGE_TYPES.PONG) {
                    // lastPong saved
                } else {
                    this.log.warn('Received unknown message type: ' + type)
                }
        };

        return this;
    }

    _garbageCollect() {
        const now = Date.now();
        let empty = 0;
        if (!DEBUG) {
            for (let i = 0; i < this.callbacks.length; i++) {
                if (this.callbacks[i]) {
                    if (this.callbacks[i].ts > now) {
                        const cb = this.callbacks[i].cb;
                        setTimeout(cb, 0, 'timeout');
                        //@ts-ignore
                        this.callbacks[i] = null;
                        empty++;
                    }
                } else {
                    empty++;
                }
            }
        }

        // remove nulls
        if (empty > this.callbacks.length / 2) {
            const newCallback = [];
            for (let i = 0; i < this.callbacks.length; i++) {
                this.callbacks[i] && newCallback.push(this.callbacks[i]);
            }
            this.callbacks = newCallback;
        }
    };

    withCallback(name: string, id: number, args: any[], cb: (...args: any) => void) {
        if (name === 'authenticate') {
            this.authTimeout = setTimeout(() => {
                this.authTimeout = null;
                if (this.connected) {
                    this.log.debug('Authenticate timeout');
                    this.handlers.error && this.handlers.error.forEach(cb => cb.call(this, 'Authenticate timeout'));
                }
                this.close();
            }, 2000);
        }
        this.callbacks.push({ id, cb, ts: DEBUG ? 0 : Date.now() + 30000 });
        (<WebSocket>this.socket).send(JSON.stringify([MESSAGE_TYPES.CALLBACK, id, name, args]));
    }

    findAnswer(id: number, args: []) {
        for (let i = 0; i < this.callbacks.length; i++) {
            if (this.callbacks[i] && this.callbacks[i].id === id) {
                const cb = this.callbacks[i].cb;
                cb.apply(null, args);
                //@ts-ignore
                this.callbacks[i] = null;
            }
        }
    }

    emit(name: string, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any) {
        if (!this.socket || !this.connected) {
            if (!this.wasConnected) {
                // cache all calls till connected
                this.pending.push([name, arg1, arg2, arg3, arg4, arg5]);
            } else {
                this.log.warn('Not connected');
            }
            return;
        }

        this.id++;

        if (name === 'writeFile' && typeof arg3 !== 'string') {
            // _adapter, filename, data, callback
            //@ts-ignore
            arg3 = arg3 && btoa(String.fromCharCode.apply(null, new Uint8Array(arg3)));
        }

        try {
            if (typeof arg5 === 'function') {
                this.withCallback(name, this.id, [arg1, arg2, arg3, arg4], arg5);
            } else if (typeof arg4 === 'function') {
                this.withCallback(name, this.id, [arg1, arg2, arg3], arg4);
            } else if (typeof arg3 === 'function') {
                this.withCallback(name, this.id, [arg1, arg2], arg3);
            } else if (typeof arg2 === 'function') {
                this.withCallback(name, this.id, [arg1], arg2);
            } else if (typeof arg1 === 'function') {
                this.withCallback(name, this.id, [], arg1);
            } else
                if (arg1 === undefined && arg2 === undefined && arg3 === undefined && arg4 === undefined && arg5 === undefined) {
                    this.socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, this.id, name]));
                } else if (arg2 === undefined && arg3 === undefined && arg4 === undefined && arg5 === undefined) {
                    this.socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, this.id, name, [arg1]]));
                } else if (arg3 === undefined && arg4 === undefined && arg5 === undefined) {
                    this.socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, this.id, name, [arg1, arg2]]));
                } else if (arg4 === undefined && arg5 === undefined) {
                    this.socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, this.id, name, [arg1, arg2, arg3]]));
                } else if (arg5 === undefined) {
                    this.socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, this.id, name, [arg1, arg2, arg3, arg4]]));
                } else {
                    this.socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, this.id, name, [arg1, arg2, arg3, arg4, arg5]]));
                }
        } catch (e) {
            console.error('Cannot send: ' + e);
            this.close();
        }
    }

    on(name: string, cb: (...args: any) => void) {
        if (cb) {
            this.handlers[name] = this.handlers[name] || [];
            this.handlers[name].push(cb);
        }
    }

    off(name: string, cb: (...args: any) => void) {
        if (this.handlers[name]) {
            const pos = this.handlers[name].indexOf(cb);
            if (pos !== -1) {
                this.handlers[name].splice(pos, 1);
                if (!this.handlers[name].length) {
                    delete this.handlers[name];
                }
            }
        }
    }

    close() {
        this.pingInterval && clearTimeout(this.pingInterval);
        this.pingInterval = null;

        this.authTimeout && clearTimeout(this.authTimeout);
        this.authTimeout = null;

        this.connectingTimer && clearTimeout(this.connectingTimer);
        this.connectingTimer = null;

        if (this.socket) {
            try {
                this.socket.close();
            } catch (e) {

            }
            this.socket = null;
        }

        if (this.connected) {
            this.handlers.disconnect && this.handlers.disconnect.forEach(cb => cb.call(this));
            this.connected = false;
        }

        this.callbacks = [];

        this._reconnect();
    }

    private _reconnect() {
        if (!this.connectTimer) {
            this.log.debug('Start reconnect ' + this.connectionCount);
            this.connectTimer = setTimeout(() => {
                this.connectTimer = null;
                if (this.connectionCount < 5) {
                    this.connectionCount++;
                }
                this.connect(<string>this.url, this.options);
            }, this.connectionCount * 1000);
        } else {
            this.log.debug('Reconnect is yet running ' + this.connectionCount);
        }
    };
}
