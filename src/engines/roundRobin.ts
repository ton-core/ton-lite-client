import { TLFunction } from "ton-tl";
import { LiteEngine } from "./engine";

export class LiteRoundRobinEngine implements LiteEngine {

    readonly engines: LiteEngine[];

    constructor(engines: LiteEngine[]) {
        this.engines = engines;
    }

    query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, args: { timeout: number, awaitSeqno?: number }): Promise<RES> {
        let id = Math.floor(Math.random() * this.engines.length);
        return this.engines[id].query(f, req, args);
    }

    close() {
        for (let q of this.engines) {
            q.close();
        }
    }
}