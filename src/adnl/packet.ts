import { randomBytes, createHash } from 'crypto'

class ADNLPacket {
    private _payload: Buffer

    private _nonce: Buffer

    constructor (payload: Buffer, nonce: Buffer = Buffer.from(randomBytes(32))) {
        this._payload = payload
        this._nonce = nonce
    }

    public get payload (): Buffer {
        return this._payload
    }

    public get nonce (): Buffer {
        return this._nonce
    }

    public get hash (): Buffer {
        return createHash('sha256')
            .update(this.nonce)
            .update(this.payload)
            .digest()
    }

    public get size (): Buffer {
        const buffer = new ArrayBuffer(4)
        const view = new DataView(buffer)

        view.setUint32(0, this._payload.length + 32 + 32, true)

        return Buffer.from(view.buffer)
    }

    public get data (): Buffer {
        return Buffer.concat([ this.size, this.nonce, this.payload, this.hash ])
    }

    public static parse (data: Buffer) {
        if (!ADNLPacket.containsFullPacket(data)) {
            throw new Error('Bad packet')
        }

        let cursor = 0
        const size = data.slice(0, cursor += 4).readUint32LE(0)

        const nonce = data.slice(cursor, cursor += 32)
        const payload = data.slice(cursor, cursor += (size - (32 + 32)))
        const hash = data.slice(cursor, cursor += 32)

        if (!hash.equals(createHash('sha256').update(nonce).update(payload).digest())) {
            throw new Error('ADNLPacket: Bad packet hash.')
        }

        return {
            packet: new ADNLPacket(payload, nonce),
            extra: data.slice(4 + size, data.byteLength)
        }
    }

    static containsFullPacket(data: Buffer): boolean {
        const size = data.readUint32LE(0)
        return data.byteLength - 4 >= size
    }
}

export { ADNLPacket }
