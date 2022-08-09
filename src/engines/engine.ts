import { TLFunction } from "ton-tl";

export type LiteEngine = {
    query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, args: { timeout: number, awaitSeqno?: number }): Promise<RES>;
    close(): void;
    isClosed(): boolean;
};