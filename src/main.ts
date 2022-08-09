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
    "ip": 1097649206,
    "port": 29296,
    "id": {
        "@type": "pub.ed25519",
        "key": "p2tSiaeSqX978BxE5zLxuTQM06WVDErf5/15QToxMYA="
    }
}
async function main() {

    const engines: LiteEngine[] = [];
    for (let i = 0; i < 50; i++) {
        engines.push(new LiteSingleEngine({
            host: `tcp://${intToIP(server.ip)}:${server.port}`,
            publicKey: Buffer.from(server.id.key, 'base64')
        }));
    }
    const engine: LiteEngine = new LiteRoundRobinEngine(engines);
    const client = new LiteClient({ engine });

    const address = Address.parse('kQC2sf_Hy34aMM7n9f9_V-ThHDehjH71LWBETy_JrTirPIHa');

    while (true) {
        let latest = await client.getMasterchainInfo();
        console.log("Latest block: " + latest.last.seqno);
        await client.getFullBlock(latest.last.seqno);

        console.log('Account state full:', Cell.fromBoc((await client.getAccountState(address, latest.last)).raw)[0].hash().toString('hex'));
        console.log('Account state prunned:', (await client.getAccountStatePrunned(address, latest.last)).stateHash?.toString('hex'));

        await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    }
}

main()

