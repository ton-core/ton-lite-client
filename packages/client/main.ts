import { LiteServerEngine } from "./engines/engine";
import { LiteServerSingleEngine } from "./engines/single";
import { LiteServerRoundRobinEngine } from "./engines/roundRobin";
import { LiteClient } from "./client";
import { Address } from "ton";
import util from 'util';

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

    const engines: LiteServerEngine[] = [];
    for (let i = 0; i < 50; i++) {
        engines.push(new LiteServerSingleEngine({
            host: intToIP(server.ip),
            port: server.port,
            publicKey: Buffer.from(server.id.key, 'base64')
        }));
    }
    const engine: LiteServerEngine = new LiteServerRoundRobinEngine(engines);
    const client = new LiteClient(engine);

    let start = Date.now();
    let mc = await client.getMasterchainInfoExt();
    console.log('Read in ' + (Date.now() - start) + ' ms');
    console.warn(mc);
    let seqno = 1;
    let read = 0;
    start = Date.now();

    let state = await client.getAccountState(Address.parse('Ef-kkdY_B7p-77TLn2hUhM6QidWrrsl8FYWCIvBMpZKprKDH'), mc.last);
    console.warn(util.inspect(state, false, null, true));

    state = await client.getAccountState(Address.parse('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF'), mc.last);
    console.warn(util.inspect(state, false, null, true));

    state = await client.getAccountState(Address.parse('Ef9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVbxn'), mc.last);
    console.warn(util.inspect(state, false, null, true));

    while (true) {

        // MC


        // await delay(1000);

        // Blocks
        let seqnos: number[] = [];
        for (let i = 0; i < 1000; i++) {
            seqnos.push(seqno++);
        }
        await Promise.all(seqnos.map(async (s) => {
            let lk = await client.lookupBlockByID({
                seqno: s,
                shard: '-9223372036854775808',
                workchain: -1
            });
            // let bh = await client.getBlockHeader(lk.id);
            let shards = await client.getAllShardsInfo(lk.id);
            return shards;
        }));
        read += seqnos.length;
        console.log('Read ' + read + ' in ' + (Date.now() - start) + ' ms');
    }
}

main()

