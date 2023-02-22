/**
 * Copyright 
 *  (c) 2022 Whales Corp.
 *  (c) 2023 TrueCarry <truecarry@gmail.com>
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */
import {
    Address,
    Cell,
    ContractProvider,
    ContractState,
    TupleReader,
    beginCell,
    storeMessage,
    toNano,
    comment,
    external,
    serializeTuple,
    TupleItem,
    parseTuple,
} from 'ton-core'
import { Maybe } from 'ton-core/dist/utils/maybe';
import { LiteClient } from './'
import { tonNode_BlockIdExt } from './schema'

export function createLiteClientProvider(
    client: LiteClient,
    block: number | null,
    address: Address,
    init: { code: Cell; data: Cell } | null
): ContractProvider {
    return {
        async getState(): Promise<ContractState> {
            // Resolve block
            let sq: tonNode_BlockIdExt // = block
            if (block === null) {
                const res = await client.getMasterchainInfo()
                sq = res.last
            } else {
                const res = await client.getFullBlock(block)
                const shard = res.shards.find((s) => s.workchain === -1) as unknown as tonNode_BlockIdExt
                sq = {
                    ...shard,
                }
            }

            // Load state
            // const state = await client.getAccount(sq, address)
            const state = await client.getAccountState(address, sq)

            // Convert state
            const last = state.lastTx // .account.last
                ? {
                    lt: BigInt(state.lastTx.lt),
                    hash: Buffer.from(state.lastTx.hash.toString(16), 'hex'),
                }
                : null
            let storage:
                | {
                    type: 'uninit'
                }
                | {
                    type: 'active'
                    code: Maybe<Buffer>
                    data: Maybe<Buffer>
                }
                | {
                    type: 'frozen'
                    stateHash: Buffer
                }

            if (state.state?.storage.state.type === 'active') {
                storage = {
                    type: 'active',
                    code: state.state?.storage.state.state.code?.toBoc(),
                    data: state.state?.storage.state.state.data?.toBoc(),
                }
            } else if (state.state?.storage.state.type === 'uninit') {
                storage = {
                    type: 'uninit',
                }
                //
            } else if (state.state?.storage.state.type === 'frozen') {
                storage = {
                    type: 'frozen',
                    stateHash: Buffer.from(state.state.storage.state.stateHash.toString(16), 'hex'),
                }
            } else {
                throw Error('Unsupported state')
            }

            return {
                balance: BigInt(state.state.storage.balance.coins),
                last,
                state: storage,
            }
        },
        async get(name, args) {
            let sq: tonNode_BlockIdExt // = block
            if (block === null) {
                const res = await client.getMasterchainInfo()
                sq = res.last
            } else {
                const res = await client.getFullBlock(block)
                const shard = res.shards.find((s) => s.workchain === -1) as unknown as tonNode_BlockIdExt
                sq = {
                    ...shard,
                }
            }

            // const method = await client.runMethod(address, name, args, sq)c
            const method = await runMethod(client, sq, address, name, args)
            if (method.exitCode !== 0 && method.exitCode !== 1) {
                throw Error('Exit code: ' + method.exitCode)
            }
            return {
                stack: new TupleReader(method.result),
            }
        },
        async external(message) {
            const res = await client.getMasterchainInfo()
            const sq = res.last

            // Resolve init
            let neededInit: { code: Cell | null; data: Cell | null } | null = null
            if (
                init &&
                (await client.getAccountState(address, sq)).state?.storage.state.type !== 'active'
            ) {
                neededInit = init
            }

            const ext = external({
                to: address,
                init: neededInit ? { code: neededInit.code, data: neededInit.data } : null,
                body: message,
            })
            const pkg = beginCell().store(storeMessage(ext)).endCell().toBoc()
            await client.sendMessage(pkg)
        },

        async internal(via, message) {
            const res = await client.getMasterchainInfo()
            const sq = res.last

            // Resolve init
            let neededInit: { code: Cell | null; data: Cell | null } | null = null
            if (
                init &&
                (await client.getAccountState(address, sq)).state?.storage.state.type !== 'active'
            ) {
                neededInit = init
            }

            // Resolve bounce
            let bounce = true
            if (message.bounce !== null && message.bounce !== undefined) {
                bounce = message.bounce
            }

            // Resolve value
            let value: bigint
            if (typeof message.value === 'string') {
                value = toNano(message.value)
            } else {
                value = message.value
            }

            // Resolve body
            let body: Cell | null = null
            if (typeof message.body === 'string') {
                body = comment(message.body)
            } else if (message.body) {
                body = message.body
            }

            // Send internal message
            await via.send({
                to: address,
                value,
                bounce,
                sendMode: message.sendMode,
                init: neededInit,
                body,
            })
        },
    }
}

/**
 * Execute run method
 * @param seqno block sequence number
 * @param address account address
 * @param name method name
 * @param args method arguments
 * @returns method result
 */
async function runMethod(
    clinet: LiteClient,
    seqno: tonNode_BlockIdExt,
    address: Address,
    name: string,
    args?: TupleItem[]
) {
    const tail = args ? serializeTuple(args).toBoc({ idx: false, crc32: false }) : Buffer.alloc(0)

    const res = await clinet.runMethod(address, name, tail, seqno)
    return {
        exitCode: res.exitCode, // res.data.exitCode,
        result: res.result ? parseTuple(Cell.fromBoc(Buffer.from(res.result, 'base64'))[0]) : [],
        resultRaw: res.result, // res.data.resultRaw,
        block: res.block,
        shardBlock: res.shardBlock,
    }
}

