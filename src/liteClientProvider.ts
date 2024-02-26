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
    parseTuple, StateInit, Contract, OpenedContract, openContract, Transaction, loadTransaction,
} from '@ton/core'
import { Maybe } from '@ton/core/dist/utils/maybe';
import { LiteClient } from './'
import { tonNode_BlockIdExt } from './schema'
import { Buffer } from "buffer";

export function createLiteClientProvider(
    client: LiteClient,
    block: number | null,
    address: Address,
    init: StateInit | null
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
            let neededInit: StateInit | null = null
            if (
                init &&
                (await client.getAccountState(address, sq)).state?.storage.state.type !== 'active'
            ) {
                neededInit = init
            }

            const ext = external({
                to: address,
                init: neededInit ?? null,
                body: message,
            })
            const pkg = beginCell().store(storeMessage(ext)).endCell().toBoc()
            await client.sendMessage(pkg)
        },

        async internal(via, message) {
            const res = await client.getMasterchainInfo()
            const sq = res.last

            // Resolve init
            let neededInit: StateInit | null = null
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
        open<T extends Contract>(contract: T): OpenedContract<T> {
            return openContract(contract, (args) => createLiteClientProvider(client, block, args.address, args.init));
        },
        async getTransactions(address: Address, lt: bigint, hash: Buffer, limit?: number): Promise<Transaction[]> {
            // Resolve last
            const useLimit = typeof limit === 'number';
            if (useLimit && limit <= 0) {
                return [];
            }

            // Load transactions
            let transactions: Transaction[] = [];
            do {
                const result = await client.getAccountTransactions(address, lt.toString(), hash, limit ?? 100);
                const txs = Cell.fromBoc(result.transactions).map((tx) => loadTransaction(tx.beginParse()));

                const firstTx = txs[0];
                const [firstLt, firstHash] = [firstTx.lt, firstTx.hash()];
                const needSkipFirst = transactions.length > 0 && firstLt === lt && firstHash.equals(hash);
                if (needSkipFirst) {
                    txs.shift();
                }

                if (txs.length === 0) {
                    break;
                }
                const lastTx = txs[txs.length - 1];
                const [lastLt, lastHash] = [lastTx.lt, lastTx.hash()];
                if (lastLt === lt && lastHash.equals(hash)) {
                    break;
                }

                transactions.push(...txs);
                lt = lastLt;
                hash = lastHash;
            } while (useLimit && transactions.length < limit);

            // Apply limit
            if (useLimit) {
                transactions = transactions.slice(0, limit);
            }

            // Return transactions
            return transactions;
        }
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

