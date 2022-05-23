import { LiteEngine } from "./engines/engine";
import { LiteSingleEngine } from "./engines/single";
import { LiteRoundRobinEngine } from "./engines/roundRobin";
import { LiteClient } from "./client";
import { Address, Cell } from "ton";
import { formatDistance } from "date-fns";
import { createBackoff } from "teslabot";
import { inspect } from "util";
const backoff = createBackoff();

function intToIP(int: number) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}

let server = {
    "ip": -1468558020,
    "port": 20640,
    "id": {
        "@type": "pub.ed25519",
        "key": "D/ezwjebrDbjs2rpaY3pYrewsI4qcu65HNNq/fim13U="
    }
}


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {

    const engines: LiteEngine[] = [];
    for (let i = 0; i < 50; i++) {
        engines.push(new LiteSingleEngine({
            host: intToIP(server.ip),
            port: server.port,
            publicKey: Buffer.from(server.id.key, 'base64')
        }));
    }
    const engine: LiteEngine = new LiteRoundRobinEngine(engines);
    const client = new LiteClient({ engine });

    let start = Date.now();
    let mc = await client.getMasterchainInfoExt();
    console.log('Read in ' + (Date.now() - start) + ' ms');
    console.warn(mc);
    // let seqno = 10;
    // let read = 0;
    start = Date.now();

    // console.warn(await client.getFullBlock(18965834));

    let block = await client.lookupBlockByID({ seqno: 20764301, shard: '-9223372036854775808', workchain: -1 });
    let state = await client.getAccountState(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'), block.id, 5000);
    console.warn(state);

    let transactions = await client.getAccountTransactions(Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'), state.lastTx!.lt, state.lastTx!.hash, 10);
    console.warn(transactions);

    // console.warn(await client.getAccountState(Address.parse('EQChp8oK-nB-Avs1rCL8Q9IieH8oAwnntwIHmYvDzD07wh6V'), block.id, 5000));


    // block/20344104/EQBy2de1hfWDDM-q5EVVIc4tHDmLXh-5fgWVvcm0Us2B2iMd

    // let res = await client.runMethod(Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales'), 'get_staking_status', Buffer.alloc(0), mc.last);
    // let res = await client.getConfig(mc.last);
    // console.warn(res);
    // console.warn(res);
    // console.warn(res);
    // let state = await client.getAccountState(Address.parse('EQBtVNI7-RxvJUXV8hARC5n8xgjEbcJLQdg6Hb9_brcbtTV7'), mc.last);

    // console.warn(state);
    // console.warn(QRoots.map((v) => v.isExotic));
    // Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L396
    // console.warn(stateRoot.readUintNumber(32).toString(16))
    // console.warn(stateRoot.readUintNumber(32).toString(16))
    // console.warn(QRoots[1]);
    //     shard_state#9023afe2 global_id:int32
    //   shard_id:ShardIdent 
    //   seq_no:uint32 vert_seq_no:#
    //   gen_utime:uint32 gen_lt:uint64
    //   min_ref_mc_seqno:uint32
    //   out_msg_queue_info:^OutMsgQueueInfo
    //   before_split:(## 1)
    //   accounts:^ShardAccounts
    //   ^[ overload_history:uint64 underload_history:uint64
    //   total_balance:CurrencyCollection
    //   total_validator_fees:CurrencyCollection
    //   libraries:(HashmapE 256 LibDescr)
    //   master_ref:(Maybe BlkMasterInfo) ]
    //   custom:(Maybe ^McStateExtra)
    //   = ShardStateUnsplit;
    // console.warn(util.inspect(state, false, null, true));

    // state = await client.getAccountState(Address.parse('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF'), mc.last);
    // console.warn(util.inspect(state, false, null, true));

    // state = await client.getAccountState(Address.parse('Ef9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVbxn'), mc.last);
    // console.warn(util.inspect(state, false, null, true));

    // let block = await client.getFullBlock(123332);
    // console.warn(inspect(block, false, null, true));
    // let shards = await client.getAllShardsInfo(block.id);
    // for (let wc in shards.shards) {
    //     for (let sh in shards.shards[wc]) {
    //         let ide = await client.lookupBlockByID({ seqno: shards.shards[wc][sh], shard: sh, workchain: parseInt(wc, 10) });
    //         console.warn(await client.listBlockTransactions(ide.id));
    //     }
    // }

    // console.warn(state.state!.storage.lastTransLt.toString(10));
    // // let lastest = await client.getAccountTransaction(Address.parse('EQCOcxb5n3-RrDkGbK_3DymwGjeVZbi65I3FmmBwrggDFN_z'), state.state!.storage.lastTransLt.toString(10), block.id);
    // // console.warn(lastest);

    // let txs = Cell.fromBoc(transactions.transactions).map((v) => parseTransaction(0, v.beginParse()));
    // // console.warn(Address.parse('EQBtVNI7-RxvJUXV8hARC5n8xgjEbcJLQdg6Hb9_brcbtTV7').hash.toString('hex'));

    // let lastmc = mc.last.seqno;
    // while (true) {

    //     // MC
    //     let res = await client.getMasterchainInfoAfter(lastmc + 1);
    //     console.warn(res);
    //     // lastmc = res.last.seqno;


    //     // await delay(1000);

    //     // Blocks
    //     // let seqnos: number[] = [];
    //     // for (let i = 0; i < 500; i++) {
    //     //     seqnos.push(seqno++);
    //     // }
    //     // await Promise.all(seqnos.map(async (s) => {
    //     //     return backoff(() => client.getFullBlock(s));
    //     // }));
    //     // read += seqnos.length;
    //     // let eta = (20_000_000 / read) * (Date.now() - start);
    //     // console.log('Read ' + read + ' in ' + (Date.now() - start) + ' ms, ETA: ' + formatDistance(eta, 0));
    // }
}

main()

