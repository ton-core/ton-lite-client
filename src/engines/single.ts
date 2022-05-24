import { randomBytes } from "crypto";
import { TLFunction, TLReadBuffer, TLWriteBuffer } from "ton-tl";
import { ADNLClient } from "../adnl";
import { Codecs, Functions } from "../schema";
import { LiteEngine } from "./engine";

type QueryReference = {
    f: TLFunction<any, any>;
    packet: Buffer,
    resolver: (res: any) => void;
    reject: (res: any) => void;
    timeout: number;
};

export class LiteSingleEngine implements LiteEngine {

    readonly host: string
    readonly port: number;
    readonly publicKey: Buffer;
    #currentClient: ADNLClient | null = null;
    #ready = false;
    #closed = false;
    #queries: Map<string, QueryReference> = new Map();

    constructor(args: { host: string, port: number, publicKey: Buffer }) {
        this.host = args.host;
        this.port = args.port;
        this.publicKey = args.publicKey;
        this.connect();
    }

    async query<REQ, RES>(f: TLFunction<REQ, RES>, req: REQ, args: { timeout: number, awaitSeqno?: number }): Promise<RES> {
        let id = randomBytes(32);

        // Request
        let writer = new TLWriteBuffer();
        f.encodeRequest(req, writer);
        let body = writer.build();

        // Lite server query
        let lsQuery = new TLWriteBuffer();
        if (args.awaitSeqno !== undefined) {
            Functions.liteServer_waitMasterchainSeqno.encodeRequest({ kind: 'liteServer.waitMasterchainSeqno', seqno: args.awaitSeqno, timeoutMs: 1000 }, lsQuery);
        }
        Functions.liteServer_query.encodeRequest({ kind: 'liteServer.query', data: body }, lsQuery);
        let lsbody = lsQuery.build();

        // ADNL body
        let adnlWriter = new TLWriteBuffer();
        Codecs.adnl_Message.encode({ kind: 'adnl.message.query', queryId: id, query: lsbody }, adnlWriter);
        const packet = adnlWriter.build();

        return new Promise<RES>((resolve, reject) => {

            // Send
            if (this.#ready) {
                this.#currentClient!.write(packet);
            }

            // Register query
            this.#queries.set(id.toString('hex'), { resolver: resolve, reject, f, packet, timeout: args.timeout });

            // Query timeout
            setTimeout(() => {
                let ex = this.#queries.get(id.toString('hex'));
                if (ex) {
                    this.#queries.delete(id.toString('hex'));
                    ex.reject(new Error('Timeout'));
                }
            }, args.timeout);
        });
    }

    close() {
        this.#closed = true;
        if (this.#currentClient) {
            let c = this.#currentClient!;
            this.#ready = false;
            this.#currentClient = null;
            c.end();
        }
    }

    private connect() {

        // Configure new client
        const client = new ADNLClient(
            this.host,
            this.port,
            this.publicKey
        );
        client.on('connect', () => {
            if (this.#currentClient === client) {
                this.onConencted();
            }
        })
        client.on('close', () => {
            if (this.#currentClient === client) {
                this.onClosed();
            }
        });
        client.on('data', (data) => {
            if (this.#currentClient === client) {
                this.onData(data);
            }
        });
        client.on('ready', async () => {
            if (this.#currentClient === client) {
                this.onReady();
            }
        });

        // Persist client
        this.#currentClient = client;
    }

    private onConencted = () => {

    }

    private onReady = () => {
        this.#ready = true;

        // Write all pendings
        for (let q of this.#queries) {
            this.#currentClient!.write(q[1].packet);
        }
    }

    private onData = (data: Buffer) => {
        let answer = Codecs.adnl_Message.decode(new TLReadBuffer(data));
        if (answer.kind === 'adnl.message.answer') {
            let id = answer.queryId.toString('hex')
            let q = this.#queries.get(id);
            if (q) {
                this.#queries.delete(id);

                // Decode response
                if (answer.answer.readInt32LE(0) === -1146494648) {
                    q.reject(new Error(Codecs.liteServer_Error.decode(new TLReadBuffer(answer.answer)).message));
                } else {
                    try {
                        let decoded = q.f.decodeResponse(new TLReadBuffer(answer.answer));

                        // Resolve
                        q.resolver(decoded);
                    } catch (e) {
                        
                        // Reject
                        q.reject(e);
                    }
                }
            }
        }
    }

    private onClosed = () => {
        this.#currentClient = null;
        this.#ready = false;
        setTimeout(() => {
            if (!this.#closed) {
                this.connect();
            }
        }, 1000);
    }
}