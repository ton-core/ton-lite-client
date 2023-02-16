import EventEmitter from "events";
import { TLFunction } from "ton-tl";
import { LiteEngine } from "./engine";

export class LiteRoundRobinEngine extends EventEmitter implements LiteEngine {

    readonly allEngines: LiteEngine[];
    private readyEngines: LiteEngine[] = [];
    
    #closed = false;
    #counter = 0;

    constructor(engines: LiteEngine[]) {
        super()

        this.allEngines = engines;

        for (const engine of engines) {
            engine.on('ready', () => {
                this.readyEngines.push(engine)
            })

            engine.on('close', () => {
                this.readyEngines = this.readyEngines.filter(e => e !== engine)
            })

            engine.on('error', () => {
                this.readyEngines = this.readyEngines.filter(e => e !== engine)
            })
        }

        for (const engine of engines) {
            if (engine.isReady()) {
                this.readyEngines.push(engine)
            }
        }
    }

    async query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, args: { timeout: number, awaitSeqno?: number }): Promise<RES> {
        if(this.#closed) {
            throw new Error('Engine is closed');
        }

        let attempts = 0
        let id = (this.#counter++ % this.readyEngines.length) || 0
        let errorsCount = 0
        while (true) {
            if (!this.readyEngines[id]?.isReady()) {
                id = ((id + 1) % this.readyEngines.length) || 0
                attempts++

                if (attempts >= this.readyEngines.length) {
                    await delay(100)
                }
                if (attempts > 200) {
                    throw new Error('No engines are available');
                }
                continue;
            }

            try {
                const res = await this.readyEngines[id].query(f, req, args);
                return res
            } catch (e) {
                id = ((id + 1) % this.readyEngines.length) || 0
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
        for (let q of this.allEngines) {
            q.close();
        }
        this.#closed = true
    }

    isClosed() {
        return this.#closed
    }

    isReady() {
        return !this.#closed
    }
}

function delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}