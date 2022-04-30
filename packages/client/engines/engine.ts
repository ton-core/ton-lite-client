import { TLFunction } from "ton-tl";

export type LiteEngine = {
    query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, timeout: number): Promise<RES>;
    close(): void;
};