import {TlReadBuffer, TlWriteBuffer} from "../tl/TlBuffer";
import {
    adnl_message_answer,
    adnl_message_query,
    liteServer_accountId,
    liteServer_accountState,
    liteServer_currentTime, liteServer_error,
    liteServer_getAccountState,
    liteServer_getMasterchainInfo,
    liteServer_getTime,
    liteServer_masterchainInfo,
    liteServer_query,
    tonNode_blockId,
    tonNode_blockIdExt
} from "../tl-gen/out";
import {TlType} from "../tl/TlType";
import {Address, Cell, fromNano, parseCurrencyCollection, Slice} from "ton";
import {pseudoRandomBytes} from "crypto";
import {ADNLClient} from "../adnl";


// storage_used$_ cells:(VarUInteger 7) bits:(VarUInteger 7)
// ext_refs:(VarUInteger 7) int_refs:(VarUInteger 7)
// public_cells:(VarUInteger 7) = StorageUsed;

function readStorageUsed(cs: Slice) {
    return {
        cells: cs.readVarUInt(3),
        bits: cs.readVarUInt(3),
        // ext_refs: cs.readVarUInt(7),
        // int_refs: cs.readVarUInt(7),
        public_cells: cs.readVarUInt(3),
    }
}

// storage_info$_ used:StorageUsed last_paid:uint32
// due_payment:(Maybe Grams) = StorageInfo;

function readStorageInfo(cs: Slice) {
    return {
        storageUsed: readStorageUsed(cs),
        lastPaid: cs.readUint(32).toNumber(),
        duePayment: cs.readBit() ? cs.readCoins() : null
    }
}


// _ split_depth:(Maybe (## 5)) special:(Maybe TickTock)
//   code:(Maybe ^Cell) data:(Maybe ^Cell)
//   library:(HashmapE 256 SimpleLib) = StateInit;

// account_uninit$00 = AccountState;
// account_active$1 _:StateInit = AccountState;
// account_frozen$01 state_hash:bits256 = AccountState;
function readAccountState(cs: Slice) {
    cs.readBit() // account_active$1
    cs.readBit() // split_depth
    cs.readBit() // special

    return {
        code: cs.readRef().toCell(),
        data: cs.readRef().toCell(),
        // library: cs.readBit()
    }
}

// account_storage$_ last_trans_lt:uint64
// balance:CurrencyCollection state:AccountState
// = AccountStorage;

function readAccountStorage(cs: Slice) {
    return {
        transLastLt: cs.readUint(64),
        balance: fromNano(parseCurrencyCollection(cs).coins),
        state: readAccountState(cs)
    }
}

// account_none$0 = Account;
// account$1 addr:MsgAddressInt storage_stat:StorageInfo
// storage:AccountStorage = Account;
function readAccount(cs: Slice) {
    cs.readBit()
    return {
        address: cs.readAddress(),
        storageStat: readStorageInfo(cs),
        storage: readAccountStorage(cs)
    }
}



function intToIP(int: number) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}

let server = {
    "ip": -1136338705,
    "port": 19925,
    "id": {
        "@type": "pub.ed25519",
        "key": "ucho5bEkufbKN1JR1BGHpkObq602whJn3Q3UwhtgSo4="
    }
}

const TL_GETTIME = '7af98bb435263e6c95d6fecb497dfd0aa5f031e7d412986b5ce720496db512052e8f2d100cdf068c7904345aad16000000000000'

const TL_PARSE_GETTIME = (data: Buffer) => {
    const unix = data.slice(data.byteLength - 7, data.byteLength - 3).readUint32LE(0)

    return new Date(unix * 1000).toString()
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function decodeType<T extends { typeId: number, new(...args: any[]): InstanceType<T>, decode: (decoder: TlReadBuffer) => InstanceType<T> }>(data: Buffer, type: T) {
    let reader = new TlReadBuffer(data)
    return reader.readType(type, true)
}

function encodeType(type: TlType) {
    let b = new TlWriteBuffer()
    b.writeType(type, true)
    return b.build()
}

async function main() {
    const client = new ADNLClient(
        intToIP(server.ip),
        server.port,
        server.id.key
    )

    let queries = new Map<string, (res: adnl_message_answer) => void>()

    function makeQuery(query: TlType): Promise<adnl_message_answer> {
        let id = pseudoRandomBytes(256/8)

        const packet = encodeType(
            new adnl_message_query(
                id,
                encodeType(
                    new liteServer_query(
                        encodeType(query)
                    )
                )
            )
        )

       return new Promise((resolve) => {
           queries.set(id.toString('hex'), resolve)
           client.write(packet)
       })
    }

    async function getMasterchainInfo() {
        let answer = await makeQuery(new liteServer_getMasterchainInfo())
        return decodeType(answer.answer, liteServer_masterchainInfo)
    }

    client.on('connect', () => console.log('on connect'))
    client.on('close', () => console.log('on close'))
    client.on('data', (data) => {
        // console.log('on data: ', TL_PARSE_GETTIME(data))


        let answer = decodeType(data, adnl_message_answer)
        // console.log(decodeType(answer.answer, liteServer_currentTime))

        // console.log('query id', answer.query_id.toString('hex'))
        let id = answer.query_id.toString('hex')
        let cb = queries.get(id)
        cb!(answer)
        queries.delete(id)

        // let masterInfo = decodeType(answer.answer, liteServer_masterchainInfo)
        // console.log(masterInfo)


        // let error = decodeType(answer.answer, liteServer_error)
        // console.log(error.message.toString())

        // let accountState = decodeType(answer.answer, liteServer_accountState)
        // console.log(accountState)



        // let query = new liteServer_getAccountState(blockId, new liteServer_accountId(0, ))

    })
    client.on('error', (error) => console.log('on error', error))
    client.on('ready', async () => {
        console.log('on ready')



        // let address = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t')

        // let address = Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales')
        // let mc = await getMasterchainInfo()
        // let pr: Promise<any>[] = []
        // for (let i = 0; i < 1000; i++) {
        //     // pr.push((async () => {
        //     //     let res = await makeQuery(new liteServer_getAccountState(
        //     //         mc.last,
        //     //         new liteServer_accountId(address.workChain, pseudoRandomBytes(32))
        //     //     ))
        //     //     return decodeType(res.answer, liteServer_accountState)
        //     // })())
        //     pr.push(makeQuery(new liteServer_getAccountState(
        //         mc.last,
        //         new liteServer_accountId(address.workChain, pseudoRandomBytes(32))
        //     )))
        // }
        //
        // console.time('kek')
        // console.log(await Promise.all(pr))
        // console.timeEnd('kek')



        let address = Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales')
        console.time('getMasterchainInfo')
        let mc = await getMasterchainInfo()
        console.timeEnd('getMasterchainInfo')
        await delay(1000)

        console.time('getAccountState')
        let res = await makeQuery(new liteServer_getAccountState(
            mc.last,
            new liteServer_accountId(address.workChain, address.hash)
        ))
        console.timeEnd('getAccountState')

        let account = decodeType(res.answer, liteServer_accountState)

        let cell = Cell.fromBoc(account.state)[0].beginParse()
        let accountDecoded = readAccount(cell)
        console.log(accountDecoded)
        console.log(Cell.fromBoc(accountDecoded.storage.state.data.toBoc()))
        console.log('\n\n')

        // while (true) {
        //
        //     console.time('getMasterchainInfo')
        //     let mc = await getMasterchainInfo()
        //     console.timeEnd('getMasterchainInfo')
        //     await delay(1000)
        //
        //     console.time('getAccountState')
        //     let res = await makeQuery(new liteServer_getAccountState(
        //         mc.last,
        //         new liteServer_accountId(address.workChain, address.hash)
        //     ))
        //     console.timeEnd('getAccountState')
        //
        //     let account = decodeType(res.answer, liteServer_accountState)
        //
        //     let cell = Cell.fromBoc(account.state)[0].beginParse()
        //
        //     console.log(readAccount(cell))
        //     console.log('\n\n')
        // }

        // console.log(query.toString('hex'))
        //
        // let counter = 0
        // let interval = setInterval(() => {
        //     // client.write(Buffer.from(TL_GETTIME, 'hex'))
        //     client.write(query)
        //
        //     // if (++counter === 5) {
        //     //     clearInterval(interval)
        //     //     client.end()
        //     // }
        // }, 1000)
    })

}

main()

