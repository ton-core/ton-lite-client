/**
 * Copyright (c) Whales Corp. 
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteEngine } from "./engines/engine";
import { LiteSingleEngine } from "./engines/single";
import { LiteRoundRobinEngine } from "./engines/roundRobin";
import { LiteClient } from "./client";
import { Address, Cell } from "@ton/core";
// import { formatDistance } from "date-fns";
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
    "ip": 1097649206,
    "port": 29296,
    "id": {
        "@type": "pub.ed25519",
        "key": "p2tSiaeSqX978BxE5zLxuTQM06WVDErf5/15QToxMYA="
    }
  }

async function main() {

    const engines: LiteEngine[] = [];
    for (let i = 0; i < 1; i++) {
        engines.push(new LiteSingleEngine({
            host: `tcp://${intToIP(server.ip)}:${server.port}`,
            // host: `wss://ws.tonlens.com/?ip=${server.ip}&port=${server.port}&pubkey=${server.id.key}`,
            publicKey: Buffer.from(server.id.key, 'base64'),
            // client: 'ws'
        }));
    }
    const engine: LiteEngine = new LiteRoundRobinEngine(engines);
    const client = new LiteClient({ engine });
    console.log('get master info')
    const master = await client.getMasterchainInfo()
    console.log('master', master)

    const address = Address.parse('kQC2sf_Hy34aMM7n9f9_V-ThHDehjH71LWBETy_JrTirPIHa');

    while (true) {
        let latest = await client.getMasterchainInfo();
        console.log("Latest block: " + latest.last.seqno);
        await client.getFullBlock(latest.last.seqno);

        const libRes = await client.getLibraries([
            Buffer.from('587cc789eff1c84f46ec3797e45fc809a14ff5ae24f1e0c7a6a99cc9dc9061ff', 'hex'),
            Buffer.from('bd3d7ccaf2b4ccf7fc8f1e9abaf8781e5a783f1d1e075dfab884b1d795f23666', 'hex')
        ])
        console.log('libRes: ', libRes)

        console.log('Account state full   :', Cell.fromBoc((await client.getAccountState(address, latest.last)).raw)[0].hash().toString('hex'));
        console.log('Account state prunned:', (await client.getAccountStatePrunned(address, latest.last)).stateHash?.toString('hex'));

        const start = Date.now()
        const res = await client.getMasterchainInfo({ timeout: 15000, awaitSeqno: latest.last.seqno + 2 })
        console.log('wait res', Date.now() - start, res)

        const blockData = await client.getFullBlock(34745880)
        // Should be 288
        console.log('block data', blockData, blockData.shards[1].transactions.length)

        await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    }
}

main()

