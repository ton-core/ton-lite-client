import {TlReadBuffer, TlWriteBuffer} from "./TlBuffer";

// export type TlTypeDecodable = { typeId: number, new(...args: any[]): InstanceType<T>, decode: (decoder: TlReadBuffer) => InstanceType<T> }

export abstract class TlType {
    getId: () => number
    encode: (encoder: TlWriteBuffer) => void

    static typeId: number
    static decode: (decoder: TlReadBuffer) => TlType
}