import { createHash } from 'crypto'

class ADNLAddress {
    private _publicKey: Uint8Array

    constructor (publicKey: Uint8Array | string) {
        const value = ADNLAddress.isBytes(publicKey) ? publicKey : (publicKey as string).trim()

        if (ADNLAddress.isBytes(value)) {
            this._publicKey = value as Uint8Array
        } else if (ADNLAddress.isHex(value)) {
            this._publicKey = new Uint8Array(Buffer.from(value as string, 'hex'))
        } else if (ADNLAddress.isBase64(value)) {
            this._publicKey = new Uint8Array(Buffer.from(value as string, 'base64'))
        }

        if (this._publicKey.length !== 32) {
            throw new Error('ADNLAddress: Bad peer public key. Must contain 32 bytes.')
        }
    }

    public get publicKey (): Uint8Array {
        return new Uint8Array(this._publicKey)
    }

    public get hash (): Uint8Array {
        const hash = createHash('sha256')
        const typeEd25519 = new Uint8Array([ 0xc6, 0xb4, 0x13, 0x48 ])

        hash.update(typeEd25519)
        hash.update(this._publicKey)

        return new Uint8Array(hash.digest())
    }

    private static isHex (data: any): boolean {
        const re = /^[a-fA-F0-9]+$/

        return typeof data === 'string' && re.test(data)
    }

    private static isBase64 (data: any): boolean {
        // eslint-disable-next-line no-useless-escape
        const re = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/

        return typeof data === 'string' && re.test(data)
    }

    private static isBytes (data: any): boolean {
        return ArrayBuffer.isView(data)
    }
}

export { ADNLAddress }
