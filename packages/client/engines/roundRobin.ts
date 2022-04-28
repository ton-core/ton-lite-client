import { TLFunction } from "ton-tl";
import { LiteServerEngine } from "./engine";

export class LiteServerRoundRobinEngine implements LiteServerEngine {

    readonly engines: LiteServerEngine[];

    constructor(engines: LiteServerEngine[]) {
        this.engines = engines;
    }

    query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, timeout: number): Promise<RES> {
        let id = Math.floor(Math.random() * this.engines.length);
        return this.engines[id].query(f, req, timeout);
    }

    close() {
        for (let q of this.engines) {
            q.close();
        }
    }
}