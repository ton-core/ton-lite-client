import BN from "bn.js";
import { parseDict, Slice } from "ton";
import { TLReadBuffer } from "ton-tl";

// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/mc-config.cpp#L1232
export function parseShards(cs: Slice) {
    if (!cs.readBit()) {
        throw Error('Invalid slice');
    }
    return parseDict(cs.readRef(), 32, (cs2) => {
        let stack: { slice: Slice, shard: BN }[] = [{ slice: cs2.readRef(), shard: new BN(1).shln(63) }];
        let res: Map<string, number> = new Map();
        while (stack.length > 0) {
            let item = stack.pop()!;
            let slice = item.slice;
            let shard = item.shard;

            let t = slice.readBit();
            if (!t) {
                slice.skip(4);
                let seqno = slice.readUintNumber(32);
                let id = new TLReadBuffer(shard.toBuffer('le', 32)).readInt64(); // Unsigned to Signed
                res.set(id, seqno);
                continue;
            }

            let delta = shard.and(shard.notn(64).addn(1)).shrn(1);
            stack.push({ slice: slice.readRef(), shard: shard.sub(delta) });
            stack.push({ slice: slice.readRef(), shard: shard.add(delta) });
        }
        return res;
    });
}