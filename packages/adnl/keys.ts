import { xed25519_ecdh } from '@tonstack/xed25519'
import { randomBytes } from 'crypto'

class ADNLKeys {
    // private _private: Uint8Array

    private _public: Uint8Array

    private _shared: Uint8Array

    constructor (peerPublicKey: Uint8Array) {
        // const clientPrivateKey = new Uint8Array(randomBytes(32))
        // const keys = xed25519_ecdh(peerPublicKey, clientPrivateKey)
        const keys = xed25519_ecdh(peerPublicKey)

        // this._private = clientPrivateKey
        this._public = keys.public
        this._shared = keys.shared
    }

    // public get private (): Uint8Array {
    //     return new Uint8Array(this._private)
    // }

    public get public (): Uint8Array {
        return new Uint8Array(this._public)
    }

    public get shared (): Uint8Array {
        return new Uint8Array(this._shared)
    }
}

export { ADNLKeys }
