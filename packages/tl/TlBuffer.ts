import {TlType} from "./TlType";

export class TlWriteBuffer {
    private used = 0
    private buf = new Buffer(128)

    #ensureSize(needBytes: number) {
        if ((this.buf.byteLength - this.used) <= needBytes) {
            this.buf = Buffer.concat([this.buf, Buffer.alloc(this.buf.byteLength)])
        }
    }

    writeInt32(val: number) {
        this.#ensureSize(4)
        this.buf.writeInt32LE(val, this.used)
        this.used += 4
    }

    writeUInt32(val: number) {
        this.#ensureSize(4)
        this.buf.writeInt32LE(val, this.used)
        this.used += 4
    }

    writeInt64(val: bigint) {
        this.#ensureSize(8)
        this.buf.writeBigInt64LE(val, this.used)
        this.used += 8
    }

    writeUInt8(val: number) {
        this.#ensureSize(4)
        this.buf.writeUint8(val, this.used)
        this.used++
    }

    writeInt256Fake(val: number) {
        this.writeUInt32(val)
        this.writeUInt32(0)
        this.writeUInt32(0)
        this.writeUInt32(0)
        this.writeUInt32(0)
        this.writeUInt32(0)
        this.writeUInt32(0)
        this.writeUInt32(0)
    }

    writeInt256Buff(val: Buffer) {
        this.#ensureSize(256/8)
        if (val.byteLength !== 256/8) {
            throw new Error('Invalid int256 length')
        }

        for (let byte of val) {
            this.writeUInt8(byte)
        }
    }

    writeBuff(buf: Buffer) {
        this.#ensureSize(buf.byteLength + 4)

        let len = 0

        if (buf.byteLength <= 253) {
            this.writeUInt8(buf.byteLength)
            len += 1
        } else {
            this.writeUInt8(254)
            throw new Error('not implemented')
        }

        for (let byte of buf) {
            this.writeUInt8(byte)
            len += 1
        }

        while (len % 4 !== 0) {
            this.writeUInt8(0)
            len += 1
        }
    }

    writeType(type: TlType, boxed: boolean = false) {
        if (boxed) {
            this.writeUInt32(type.getId())
        }
        type.encode(this)
    }

    build() {
        return this.buf.slice(0, this.used)
    }
}

export class TlReadBuffer {
    private offset = 0
    constructor(private buf: Buffer) {

    }

    #ensureSize(needBytes: number) {
        if (this.offset + needBytes > this.buf.byteLength) {
            throw new Error('Not enough bytes')
        }
    }

    readInt32() {
        this.#ensureSize(4)
        let val = this.buf.readInt32LE(this.offset)
        this.offset += 4
        return val
    }

    readUInt32() {
        this.#ensureSize(4)
        let val = this.buf.readInt32LE(this.offset)
        this.offset += 4
        return val
    }

    readInt64() {
        this.#ensureSize(8)
        let val = this.buf.readBigInt64LE(this.offset)
        this.offset += 8
        return val
    }

    readUInt8() {
        this.#ensureSize(1)
        let val = this.buf.readUint8(this.offset)
        this.offset++
        return val
    }

    readInt256Fake() {
        this.#ensureSize(256/8)
        let val = this.buf.readUint32LE(this.offset)
        this.offset += 256/8
        return val
    }

    readInt256Buff() {
        this.#ensureSize(256/8)
        let buff = this.buf.slice(this.offset, this.offset + 256/8)
        this.offset += 256/8
        return buff
    }

    readBuff() {
        let size = 1
        let len = this.readUInt8()

        if (len === 254) {
            len = this.buf.readUintLE(this.offset, 3)
            this.offset += 3
            size += 3
        }

        size += len

        let buff = this.buf.slice(this.offset, this.offset + len)
        this.offset += len

        while (size % 4 !== 0) {
            this.readUInt8()
            size += 1
        }

        return buff
    }

    readType<T extends { typeId: number, new(...args: any[]): InstanceType<T>, decode: (decoder: TlReadBuffer) => InstanceType<T> }>(type: T, boxed: boolean = false) {
        if (boxed) {
            let typeId = this.readUInt32()
            if (typeId !== type.typeId) {
                throw new Error(`Type id mismatch, expected: ${type.typeId}, got: ${typeId}`)
            }
        }
        // type.encode(this)
        return type.decode(this)
    }
}