import EventEmitter from 'events'
import {
    Socket as SocketTCP,
    createConnection
} from 'net'
import {
    Socket as SocketUDP,
    createSocket
} from 'dgram'
import {
    createCipheriv,
    createDecipheriv,
    Cipher,
    Decipher
} from 'crypto'
import { ADNLAESParams } from './params'
import { ADNLPacket } from './packet'
import { ADNLAddress } from './address'
import { ADNLKeys } from './keys'

enum ADNLClientState {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED
}

interface ADNLClientOptions {
    type: 'tcp4' | 'udp4'
}

interface ADNLClient {
    emit(event: 'connect'): boolean
    emit(event: 'ready'): boolean
    emit(event: 'close'): boolean
    emit(event: 'data', data: Buffer): boolean
    emit(event: 'error', error: Error): boolean

    on(event: 'connect', listener: () => void): this
    on(event: 'ready', listener: () => void): this
    on(event: 'close', listener: () => void): this
    on(event: 'data', listener: (data: Buffer) => void): this
    on(event: 'error', listener: (error: Error, close: boolean) => void): this

    once(event: 'connect', listener: () => void): this
    once(event: 'ready', listener: () => void): this
    once(event: 'close', listener: () => void): this
    once(event: 'data', listener: (data: Buffer) => void): this
    once(event: 'error', listener: (error: Error, close: boolean) => void): this
}

class ADNLClient extends EventEmitter {
    private socket: SocketTCP | SocketUDP

    private address: ADNLAddress

    private params: ADNLAESParams

    private keys: ADNLKeys

    private cipher: Cipher

    private decipher: Decipher

    private _state = ADNLClientState.CONNECTING

    private inBuff: Buffer = Buffer.alloc(0)

    constructor (host: string, port: number, peerPublicKey: Uint8Array | string, options?: ADNLClientOptions) {
        super()

        const { type = 'tcp4' } = options || {}

        this.address = new ADNLAddress(peerPublicKey)
        this.keys = new ADNLKeys(this.address.publicKey)
        this.params = new ADNLAESParams()
        this.cipher = createCipheriv('aes-256-ctr', this.params.txKey, this.params.txNonce)
        this.decipher = createDecipheriv('aes-256-ctr', this.params.rxKey, this.params.rxNonce)

        if (type === 'tcp4') {
            this.socket = createConnection(({ host, port }))
                .on('connect', this.onConnect.bind(this))
                .on('ready', this.handshake.bind(this))
                .on('close', this.onClose.bind(this))
                .on('data', this.onData.bind(this))
                .on('error', this.onError.bind(this))
        } else if (type === 'udp4') {
            this.socket = createSocket(type)
                .on('connect', this.onConnect.bind(this))
                .on('close', this.onClose.bind(this))
                .on('message', this.onData.bind(this))
                .on('error', this.onError.bind(this))

            this.socket.connect(port, host, this.handshake.bind(this))
        } else {
            throw new Error('ADNLClient: Type must be "tcp4" or "udp4"')
        }
    }

    public get state (): ADNLClientState {
        return this._state
    }

    public write (data: Buffer): void {
        const packet = new ADNLPacket(data)
        const encrypted = this.encrypt(packet.data)

        this.socket instanceof SocketTCP
            ? this.socket.write(encrypted)
            : this.socket.send(encrypted)
    }

    public end (): void {
        this.socket instanceof SocketTCP
            ? this.socket.end()
            : this.socket.disconnect()
    }

    private onConnect () {
        this.emit('connect')
    }

    private onReady (): void {
        this._state = ADNLClientState.OPEN
        this.emit('ready')
    }

    private onClose (): void {
        this._state = ADNLClientState.CLOSED
        this.emit('close')
    }

    private tryProcess(chunk: Buffer) {
        const decrypted = this.decrypt(chunk)
        this.inBuff = Buffer.concat([this.inBuff, decrypted])
        let canParse = ADNLPacket.containsFullPacket(this.inBuff)

        if (!canParse) {
            console.log('cant parse yet')
            return
        }
        const {packet, extra} = ADNLPacket.parse(this.inBuff)

        this.inBuff = extra


    }
    private onData (data: Buffer): void {
        const decrypted = this.decrypt(data)



        // console.log('hex', decrypted.toString('hex'))
        this.inBuff = Buffer.concat([this.inBuff, decrypted])


        while (this.inBuff.byteLength > 0) {
            let canParse = ADNLPacket.containsFullPacket(this.inBuff)

            if (!canParse) {
                // console.log('cant parse yet')
                return
            }
            const {packet, extra} = ADNLPacket.parse(this.inBuff)
            this.inBuff = extra

            switch (this.state) {
                case ADNLClientState.CONNECTING:
                    // if (packet.payload.length === 0) {
                    //     this.onReady()
                    // } else {
                    //     this.onError(new Error('ADNLClient: Bad handshake.'), true)
                    // }
                    return packet.payload.length === 0
                        ? this.onReady()
                        : this.onError(new Error('ADNLClient: Bad handshake.'), true)
                default:
                    this.emit('data', packet.payload)

                    // return undefined
            }
        }



    }

    private onError (error: Error, close = false): void {
        if (close) {
            this.socket instanceof SocketTCP
                ? this.socket.end()
                : this.socket.disconnect()
        }

        this.emit('error', error)
    }

    private handshake (): void {
        const key = Buffer.concat([ this.keys.shared.slice(0, 16), this.params.hash.slice(16, 32) ])
        const nonce = Buffer.concat([ this.params.hash.slice(0, 4), this.keys.shared.slice(20, 32) ])
        const cipher = createCipheriv('aes-256-ctr', key, nonce)
        const payload = Buffer.concat([ cipher.update(this.params.bytes), cipher.final() ])
        const packet = Buffer.concat([ this.address.hash, this.keys.public, this.params.hash, payload ])

        this.socket instanceof SocketTCP
            ? this.socket.write(packet)
            : this.socket.send(packet)
    }

    private encrypt (data: Buffer): Buffer {
        return Buffer.concat([ this.cipher.update(data) ])
    }

    private decrypt (data: Buffer): Buffer {
        return Buffer.concat([ this.decipher.update(data) ])
    }
}

export { ADNLClient }
