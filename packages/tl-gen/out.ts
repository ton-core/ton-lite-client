import {TlWriteBuffer, TlReadBuffer} from "../tl/TlBuffer";
import {TlType} from "../tl/TlType";

export class adnl_message_query extends TlType {
    static typeId = -1265895046

    constructor(public query_id: Buffer, public query: Buffer) {
        super()
    }

    getId = () => -1265895046

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt256Buff(this.query_id)
        encoder.writeBuff(this.query)
    }

    static decode = (decoder: TlReadBuffer) => {
        let query_id = decoder.readInt256Buff()
        let query = decoder.readBuff()
        return new adnl_message_query(query_id, query)
    }
}


export class liteServer_currentTime extends TlType {
    static typeId = -380436467

    constructor(public now: number) {
        super()
    }

    getId = () => -380436467

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt32(this.now)
    }

    static decode = (decoder: TlReadBuffer) => {
        let now = decoder.readInt32()
        return new liteServer_currentTime(now)
    }
}


export class tonNode_blockId extends TlType {
    static typeId = -1211256473

    constructor(public workchain: number, public shard: bigint, public seqno: number) {
        super()
    }

    getId = () => -1211256473

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt32(this.workchain)
        encoder.writeInt64(this.shard)
        encoder.writeInt32(this.seqno)
    }

    static decode = (decoder: TlReadBuffer) => {
        let workchain = decoder.readInt32()
        let shard = decoder.readInt64()
        let seqno = decoder.readInt32()
        return new tonNode_blockId(workchain, shard, seqno)
    }
}


export class tonNode_blockIdExt extends TlType {
    static typeId = 1733487480

    constructor(public workchain: number, public shard: bigint, public seqno: number, public root_hash: Buffer, public file_hash: Buffer) {
        super()
    }

    getId = () => 1733487480

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt32(this.workchain)
        encoder.writeInt64(this.shard)
        encoder.writeInt32(this.seqno)
        encoder.writeInt256Buff(this.root_hash)
        encoder.writeInt256Buff(this.file_hash)
    }

    static decode = (decoder: TlReadBuffer) => {
        let workchain = decoder.readInt32()
        let shard = decoder.readInt64()
        let seqno = decoder.readInt32()
        let root_hash = decoder.readInt256Buff()
        let file_hash = decoder.readInt256Buff()
        return new tonNode_blockIdExt(workchain, shard, seqno, root_hash, file_hash)
    }
}


export class tonNode_zeroStateIdExt extends TlType {
    static typeId = 494024110

    constructor(public workchain: number, public root_hash: Buffer, public file_hash: Buffer) {
        super()
    }

    getId = () => 494024110

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt32(this.workchain)
        encoder.writeInt256Buff(this.root_hash)
        encoder.writeInt256Buff(this.file_hash)
    }

    static decode = (decoder: TlReadBuffer) => {
        let workchain = decoder.readInt32()
        let root_hash = decoder.readInt256Buff()
        let file_hash = decoder.readInt256Buff()
        return new tonNode_zeroStateIdExt(workchain, root_hash, file_hash)
    }
}


export class adnl_message_answer extends TlType {
    static typeId = 262964246

    constructor(public query_id: Buffer, public answer: Buffer) {
        super()
    }

    getId = () => 262964246

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt256Buff(this.query_id)
        encoder.writeBuff(this.answer)
    }

    static decode = (decoder: TlReadBuffer) => {
        let query_id = decoder.readInt256Buff()
        let answer = decoder.readBuff()
        return new adnl_message_answer(query_id, answer)
    }
}


export class liteServer_error extends TlType {
    static typeId = -1146494648

    constructor(public code: number, public message: Buffer) {
        super()
    }

    getId = () => -1146494648

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt32(this.code)
        encoder.writeBuff(this.message)
    }

    static decode = (decoder: TlReadBuffer) => {
        let code = decoder.readInt32()
        let message = decoder.readBuff()
        return new liteServer_error(code, message)
    }
}


export class liteServer_accountId extends TlType {
    static typeId = 1973478085

    constructor(public workchain: number, public id: Buffer) {
        super()
    }

    getId = () => 1973478085

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt32(this.workchain)
        encoder.writeInt256Buff(this.id)
    }

    static decode = (decoder: TlReadBuffer) => {
        let workchain = decoder.readInt32()
        let id = decoder.readInt256Buff()
        return new liteServer_accountId(workchain, id)
    }
}


export class liteServer_accountState extends TlType {
    static typeId = 1887029073

    constructor(public id: tonNode_blockIdExt, public shardblk: tonNode_blockIdExt, public shard_proof: Buffer, public proof: Buffer, public state: Buffer) {
        super()
    }

    getId = () => 1887029073

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeType(this.id)
        encoder.writeType(this.shardblk)
        encoder.writeBuff(this.shard_proof)
        encoder.writeBuff(this.proof)
        encoder.writeBuff(this.state)
    }

    static decode = (decoder: TlReadBuffer) => {
        let id = decoder.readType(tonNode_blockIdExt)
        let shardblk = decoder.readType(tonNode_blockIdExt)
        let shard_proof = decoder.readBuff()
        let proof = decoder.readBuff()
        let state = decoder.readBuff()
        return new liteServer_accountState(id, shardblk, shard_proof, proof, state)
    }
}


export class liteServer_masterchainInfo extends TlType {
    static typeId = -2055001983

    constructor(public last: tonNode_blockIdExt, public state_root_hash: Buffer, public init: tonNode_zeroStateIdExt) {
        super()
    }

    getId = () => -2055001983

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeType(this.last)
        encoder.writeInt256Buff(this.state_root_hash)
        encoder.writeType(this.init)
    }

    static decode = (decoder: TlReadBuffer) => {
        let last = decoder.readType(tonNode_blockIdExt)
        let state_root_hash = decoder.readInt256Buff()
        let init = decoder.readType(tonNode_zeroStateIdExt)
        return new liteServer_masterchainInfo(last, state_root_hash, init)
    }
}


export class liteServer_masterchainInfoExt extends TlType {
    static typeId = -1462968075

    constructor(public mode: number, public version: number, public capabilities: bigint, public last: tonNode_blockIdExt, public last_utime: number, public now: number, public state_root_hash: Buffer, public init: tonNode_zeroStateIdExt) {
        super()
    }

    getId = () => -1462968075

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt32(this.mode)
        encoder.writeInt32(this.version)
        encoder.writeInt64(this.capabilities)
        encoder.writeType(this.last)
        encoder.writeInt32(this.last_utime)
        encoder.writeInt32(this.now)
        encoder.writeInt256Buff(this.state_root_hash)
        encoder.writeType(this.init)
    }

    static decode = (decoder: TlReadBuffer) => {
        let mode = decoder.readInt32()
        let version = decoder.readInt32()
        let capabilities = decoder.readInt64()
        let last = decoder.readType(tonNode_blockIdExt)
        let last_utime = decoder.readInt32()
        let now = decoder.readInt32()
        let state_root_hash = decoder.readInt256Buff()
        let init = decoder.readType(tonNode_zeroStateIdExt)
        return new liteServer_masterchainInfoExt(mode, version, capabilities, last, last_utime, now, state_root_hash, init)
    }
}


export class liteServer_version extends TlType {
    static typeId = 1510248933

    constructor(public mode: number, public version: number, public capabilities: bigint, public now: number) {
        super()
    }

    getId = () => 1510248933

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeInt32(this.mode)
        encoder.writeInt32(this.version)
        encoder.writeInt64(this.capabilities)
        encoder.writeInt32(this.now)
    }

    static decode = (decoder: TlReadBuffer) => {
        let mode = decoder.readInt32()
        let version = decoder.readInt32()
        let capabilities = decoder.readInt64()
        let now = decoder.readInt32()
        return new liteServer_version(mode, version, capabilities, now)
    }
}


export class liteServer_blockData extends TlType {
    static typeId = -1519063700

    constructor(public id: tonNode_blockIdExt, public data: Buffer) {
        super()
    }

    getId = () => -1519063700

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeType(this.id)
        encoder.writeBuff(this.data)
    }

    static decode = (decoder: TlReadBuffer) => {
        let id = decoder.readType(tonNode_blockIdExt)
        let data = decoder.readBuff()
        return new liteServer_blockData(id, data)
    }
}


export class liteServer_getTime extends TlType {
    static typeId = 380459572

    constructor() {
        super()
    }

    getId = () => 380459572

    encode = (encoder: TlWriteBuffer) => {
    }

    static decode = (decoder: TlReadBuffer) => {
        return new liteServer_getTime()
    }
}


export class liteServer_query extends TlType {
    static typeId = 2039219935

    constructor(public data: Buffer) {
        super()
    }

    getId = () => 2039219935

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeBuff(this.data)
    }

    static decode = (decoder: TlReadBuffer) => {
        let data = decoder.readBuff()
        return new liteServer_query(data)
    }
}


export class liteServer_getMasterchainInfo extends TlType {
    static typeId = -1984567762

    constructor() {
        super()
    }

    getId = () => -1984567762

    encode = (encoder: TlWriteBuffer) => {
    }

    static decode = (decoder: TlReadBuffer) => {
        return new liteServer_getMasterchainInfo()
    }
}


export class liteServer_getAccountState extends TlType {
    static typeId = 1804144165

    constructor(public id: tonNode_blockIdExt, public account: liteServer_accountId) {
        super()
    }

    getId = () => 1804144165

    encode = (encoder: TlWriteBuffer) => {
        encoder.writeType(this.id)
        encoder.writeType(this.account)
    }

    static decode = (decoder: TlReadBuffer) => {
        let id = decoder.readType(tonNode_blockIdExt)
        let account = decoder.readType(liteServer_accountId)
        return new liteServer_getAccountState(id, account)
    }
}


