import { TLFunction } from "ton-tl";

export type LiteServerEngine = {
    query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, timeout: number): Promise<RES>;
    close(): void;
};