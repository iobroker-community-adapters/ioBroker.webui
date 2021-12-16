/*!
 * ioBroker WebSockets
 * Copyright 2020, bluefox <dogafox@gmail.com>
 * Released under the MIT License.
 * v 0.2.1 (2020_10_16)
 */
/// <reference types="node" />
export declare class SocketClient {
    handlers: {
        [name: string]: ((...args: any) => void)[];
    };
    lastPong: number;
    socket: WebSocket | null;
    wasConnected: boolean;
    connectTimer: NodeJS.Timeout | null;
    connectingTimer: NodeJS.Timeout | null;
    connectionCount: number;
    callbacks: {
        id: number;
        cb: () => void;
        ts: number;
    }[];
    private pending;
    url?: string;
    options?: {
        name?: string;
    };
    pingInterval: NodeJS.Timeout | null;
    id: number;
    sessionID?: number;
    authTimeout: NodeJS.Timeout | null;
    connected: boolean;
    log: {
        debug: (text: any) => void;
        warn: (text: any) => void;
        error: (text: any) => void;
    };
    connect(_url: string, _options?: {
        name?: string;
    }): void | this;
    _garbageCollect(): void;
    withCallback(name: string, id: number, args: any[], cb: (...args: any) => void): void;
    findAnswer(id: number, args: []): void;
    emit(name: string, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any): void;
    on(name: string, cb: (...args: any) => void): void;
    off(name: string, cb: (...args: any) => void): void;
    close(): void;
    private _reconnect;
}
