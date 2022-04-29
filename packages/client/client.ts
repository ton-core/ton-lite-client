import { BN } from "bn.js";
import { Address, Cell, parseAccount } from "ton";
import { parseShardStateUnsplit } from "ton/dist/block/parse";
import { LiteServerEngine } from "./engines/engine";
import { parseShards } from "./parser/parseShards";
import { Functions } from "./schema";

export class LiteClient {
    readonly engine: LiteServerEngine;

    constructor(engine: LiteServerEngine) {
        this.engine = engine;
    }

    //
    // State
    //

    getMasterchainInfo = async () => {
        return this.engine.query(Functions.liteServer_getMasterchainInfo, { kind: 'liteServer.masterchainInfo' }, 5000);
    }

    getMasterchainInfoExt = async () => {
        return this.engine.query(Functions.liteServer_getMasterchainInfoExt, { kind: 'liteServer.masterchainInfoExt', mode: 0 }, 5000);
    }

    getCurrentTime = async () => {
        return (await this.engine.query(Functions.liteServer_getTime, { kind: 'liteServer.getTime' }, 5000)).now;
    }

    getVersion = async () => {
        return (await this.engine.query(Functions.liteServer_getVersion, { kind: 'liteServer.getVersion' }, 5000));
    }

    //
    // Account
    //

    getAccountState = async (src: Address, props: { seqno: number, shard: string, workchain: number, rootHash: Buffer, fileHash: Buffer }) => {
        let res = (await this.engine.query(Functions.liteServer_getAccountState, {
            kind: 'liteServer.getAccountState',
            id: {
                kind: 'tonNode.blockIdExt',
                seqno: props.seqno,
                shard: props.shard,
                workchain: props.workchain,
                fileHash: props.fileHash,
                rootHash: props.rootHash
            },
            account: {
                kind: 'liteServer.accountId',
                workchain: src.workChain,
                id: src.hash
            }
        }, 5000));

        let account = parseAccount(Cell.fromBoc(res.state)[0].beginParse())!;

        let lastTx: { lt: string, hash: Buffer } | null = null;
        if (account) {
            let shardState = parseShardStateUnsplit(Cell.fromBoc(res.proof)[1].refs[0].beginParse());
            let hashId = new BN(src.hash.toString('hex'), 'hex').toString(10);
            let pstate = shardState.accounts.get(hashId);
            if (pstate) {
                lastTx = { hash: pstate.shardAccount.lastTransHash, lt: pstate.shardAccount.lastTransLt.toString(10) };
            }
        }

        return {
            state: account,
            lastTx,
            raw: res.state,
            proof: res.proof,
            block: res.id,
            shardBlock: res.shardblk,
            shardProof: res.shardProof
        }
    }

    getAccountTransaction = async (src: Address, lt: string, props: { seqno: number, shard: string, workchain: number, rootHash: Buffer, fileHash: Buffer }) => {
        return await this.engine.query(Functions.liteServer_getOneTransaction, {
            kind: 'liteServer.getOneTransaction',
            id: props,
            account: {
                kind: 'liteServer.accountId',
                workchain: src.workChain,
                id: src.hash
            },
            lt: lt
        }, 5000);
    }

    getAccountTransactions = async (src: Address, lt: string, hash: Buffer) => {
        return await this.engine.query(Functions.liteServer_getTransactions, {
            kind: 'liteServer.getTransactions',
            count: 1,
            account: {
                kind: 'liteServer.accountId',
                workchain: src.workChain,
                id: src.hash
            },
            lt: lt,
            hash: hash
        }, 5000);
    }

    //
    // Block
    //

    lookupBlockByID = async (props: { seqno: number, shard: string, workchain: number }) => {
        return await this.engine.query(Functions.liteServer_lookupBlock, {
            kind: 'liteServer.lookupBlock',
            mode: 1,
            id: {
                kind: 'tonNode.blockId',
                seqno: props.seqno,
                shard: props.shard,
                workchain: props.workchain
            },
            lt: null,
            utime: null
        }, 5000);
    }

    getBlockHeader = async (props: { seqno: number, shard: string, workchain: number, rootHash: Buffer, fileHash: Buffer }) => {
        return await this.engine.query(Functions.liteServer_getBlockHeader, {
            kind: 'liteServer.getBlockHeader',
            mode: 1,
            id: {
                kind: 'tonNode.blockIdExt',
                seqno: props.seqno,
                shard: props.shard,
                workchain: props.workchain,
                rootHash: props.rootHash,
                fileHash: props.fileHash
            }
        }, 5000);
    }

    getAllShardsInfo = async (props: { seqno: number, shard: string, workchain: number, rootHash: Buffer, fileHash: Buffer }) => {
        let res = (await this.engine.query(Functions.liteServer_getAllShardsInfo, { kind: 'liteServer.getAllShardsInfo', id: props }, 5000));
        let parsed = parseShards(Cell.fromBoc(res.data)[0].beginParse());
        let shards: { [key: string]: { [key: string]: number } } = {};
        for (let p of parsed) {
            shards[p[0]] = {};
            for (let p2 of p[1]) {
                shards[p[0]][p2[0]] = p2[1];
            }
        }
        return {
            id: res.id,
            shards,
            raw: res.data,
            proof: res.proof
        }
    }

    listBlockTransactions = async (props: { seqno: number, shard: string, workchain: number, rootHash: Buffer, fileHash: Buffer }) => {
        return await this.engine.query(Functions.liteServer_listBlockTransactions, {
            kind: 'liteServer.listBlockTransactions',
            id: {
                kind: 'tonNode.blockIdExt',
                seqno: props.seqno,
                shard: props.shard,
                workchain: props.workchain,
                rootHash: props.rootHash,
                fileHash: props.fileHash
            },
            mode: 1 + 2 + 4 + 32,
            count: 100,
            reverseOrder: null,
            after: null,
            wantProof: null
        }, 5000);
    }
}