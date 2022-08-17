import { TLFunction } from "ton-tl";
import { LiteEngine } from "./engine";

export class LiteRoundRobinEngine implements LiteEngine {

    readonly engines: LiteEngine[];
    
    #closed = false;
    #counter = 0;

    constructor(engines: LiteEngine[]) {
        this.engines = engines;
    }

    async query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, args: { timeout: number, awaitSeqno?: number }): Promise<RES> {
        if(this.#closed) {
            throw new Error('Engine is closed');
        }

        let attempts = 0
        let id = this.#counter++ % this.engines.length
        let errorsCount = 0
        while (true) {
            if (this.engines[id].isClosed()) {
                id = (id + 1) % this.engines.length
                attempts++

                if (attempts >= this.engines.length) {
                    await delay(100)
                }
                if (attempts > 200) {
                    throw new Error('No engines are available');
                }
                continue;
            }

            try {
                const res = await this.engines[id].query(f, req, args);
                return res
            } catch (e) {
                id = (id + 1) % this.engines.length
                if (e instanceof Error && e.message === 'Timeout') {
                    continue
                }
                errorsCount++

                if (errorsCount > 20) {
                    throw e
                }

                await delay(100)
            }
        }
    }

    close() {
        for (let q of this.engines) {
            q.close();
        }
        this.#closed = true
    }

    isClosed() {
        return this.#closed
    }
}

function delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}