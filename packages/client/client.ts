import { Address, Cell, parseAccount } from "ton";
import { LiteServerEngine } from "./engines/engine";
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

        return {
            state: parseAccount(Cell.fromBoc(res.state)[0].beginParse()),
            raw: res.state,
            proof: res.proof,
            block: res.id,
            shardBlock: res.shardblk,
            shardProof: res.shardProof
        }
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
        return (await this.engine.query(Functions.liteServer_getAllShardsInfo, { kind: 'liteServer.getAllShardsInfo', id: props }, 5000));
    }
}