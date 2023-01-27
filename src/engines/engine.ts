import { TLFunction } from "ton-tl";

export interface LiteEngine {
    query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, args: { timeout: number, awaitSeqno?: number }): Promise<RES>;
    close(): void;
    isClosed(): boolean;
    isReady(): boolean;

    emit(event: 'connect'): boolean;
    emit(event: 'ready'): boolean;
    emit(event: 'close'): boolean;
    emit(event: 'error', error: Error): boolean;
    on(event: 'connect', listener: () => void): this;
    on(event: 'ready', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (error: Error, close: boolean) => void): this;
    once(event: 'connect', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;
    once(event: 'close', listener: () => void): this;
    once(event: 'error', listener: (error: Error, close: boolean) => void): this;
};