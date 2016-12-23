// @flow

/*
 * Container format
 *
 * |string content|
 * |binary content|
 * |hash||binary content|
 * |randomization nonce||bytes from above|
 * |encrypted bytes from above|
 * |file format identifier (4B)||container format identifier (4B)||encryption nonce(16 B)||bytes from above|
 */

declare module 'js-sha3' {
    declare function sha3_512(input: string): string
}

import {sha3_512} from 'js-sha3'

declare var crypto: {
    subtle:any,
    getRandomValues:(intArray: Uint8Array) => void
}

/** in bytes */
const INIT_VECTOR_LENGTH = 256 / 8

const KEY_DERIVATION_SALT = 'key derivation salt'

const FORMAT_VERSION = 1

const UNSUPPORTED_FORMAT_VERSION = 'unsupported format version'

const HASH_LENGTH_CHARS = 128
const HASH_LENGTH_BYTES = 64

// workaround https://github.com/babel/babel/issues/5032
function* _dummy() {}

// file format version(4B),encrypted blob

function toBinary(text:string): Uint8Array {
    return new TextEncoder('utf-8') // TODO remove constructor param
        .encode(text)
}

function toString(byteArray: Uint8Array): string {
    return new TextDecoder('utf-8')
        .decode(byteArray);
}

async function toCryptoKey(password:string): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', toBinary(password), {name: 'PBKDF2'}, false, ['deriveBits', 'deriveKey'])
}

async function deriveKey(binaryPasswordKey) {
    return crypto.subtle.deriveKey({
            "name": 'PBKDF2',
            "salt": toBinary(KEY_DERIVATION_SALT),
            "iterations": 100,
            "hash": 'SHA-256'
        },
        binaryPasswordKey,
        // For AES the length required to be 128 or 256 bits (not bytes)
        {"name": 'AES-CTR', "length": 256},
        true, // extractabe
        // this web crypto object will only be allowed for these functions
        ["encrypt", "decrypt"]);
}
export async function encrypt(password:string, cleartext:Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    if (nonce.length != 16) {
        throw new Error()
    }
    const binaryPasswordKey = await toCryptoKey(password)
    const key = await deriveKey(binaryPasswordKey);
    const counter = new Uint8Array(nonce); // AES-CTR requires 16B
    const cryptotext = await crypto.subtle.encrypt({"name": "AES-CTR", counter, length: 24}, key, cleartext)
    return new Uint8Array(cryptotext)
}

export async function decrypt(password: string, cryptoText: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    const binaryPasswordKey = await toCryptoKey(password)
    const key = await deriveKey(binaryPasswordKey);
    const counter = new Uint8Array(16); // AES-CTR requires 16B
    counter.set(nonce);
    return crypto.subtle.decrypt({"name": "AES-CTR", counter, length: 24}, key, cryptoText)
}

export async function completeDecrypt(password: string, blob: Uint8Array): Promise<string> {
    const version = new Uint32Array(blob.buffer.slice(0, 4))
    if (version[0] !== FORMAT_VERSION) {
        throw UNSUPPORTED_FORMAT_VERSION
    }
    const nonce = blob.subarray(4, 4 + 16);
    const cryptoText = blob.subarray(4 + 16)
    const plainBytes = await decrypt(password, cryptoText, nonce)
    return toString(plainBytes)
}

export async function completeEncrypt(password: string, clearText: string): Promise<Uint8Array> {
    // TODO add identifying word
    const version = Uint32Array.of(FORMAT_VERSION)
    const nonce = new Uint8Array(16)
    crypto.getRandomValues(nonce)
    const cryptText = await encrypt(password, toBinary(clearText), nonce)
    return concat(version, nonce, cryptText)
}

export function concat(...typedArrays: Array<Uint8Array|Uint32Array|ArrayBuffer>): Uint8Array {
    const resultLength = typedArrays.reduce((sum, current) => sum + current.byteLength, 0)
    const result = new Uint8Array(resultLength)
    let startingOffset = 0
    typedArrays.forEach(array => {
        const typeArray = array instanceof ArrayBuffer ? new Uint8Array(array) : array
        result.set(typeArray, startingOffset)
        startingOffset += array.byteLength
    })
    return result
}

declare interface CryptoKey {}

function prependHash(input: string): string {
    const hash = sha3_512(input)
    return hash + input
}

function verifyHash(hashedMessage: string): ?string {
    const originalHash = hashedMessage.substr(0, HASH_LENGTH_CHARS)
    const message = hashedMessage.substr(HASH_LENGTH_CHARS)
    const newHash = sha3_512(message)
    return originalHash === newHash
        ? message
        : null
}

function* createRandomIterator(nonce: Uint8Array) {
    if (nonce.length != HASH_LENGTH_BYTES) {
        throw new Error()
    }
    const numberWidth = 4
    /** structure |block index (numberWidth B)||(nonce HASH_LENGTH_BYTES B)| */
    const blockToHash = new ArrayBuffer(HASH_LENGTH_BYTES + numberWidth);
    new Uint8Array(blockToHash, numberWidth).set(nonce)
    const blockToHashView = new DataView(blockToHash)
    let blockIndex = 0
    while (true) {
        blockToHashView.setInt32(blockIndex)
        const hashArrayBuffer = sha3_512.arrayBuffer(blockToHash)
        const hashArray = new Uint8Array(hashArrayBuffer)
        yield* hashArray
    }
}

declare interface Iterator<T> {
    next(): IteratorResult<T>
}

function takeUint8(iterator: Iterator<number>, count: number): Uint8Array {
    const result = new Uint8Array(count)
    return result.map((_, index) => iterator.next().value)
}

function randomUint8Array(seed: Uint8Array, length: number): Uint8Array {
    const iterator = createRandomIterator(seed)
    const result = takeUint8(iterator, length)
    return result
}

function randomize(input: Uint8Array): Uint8Array {
    const nonce = new Uint8Array(HASH_LENGTH_BYTES);
    crypto.getRandomValues(nonce)
    const result = parametrizedRandomize(input, nonce)
    return result
}

function parametrizedRandomize(input: Uint8Array, nonce: Uint8Array): Uint8Array {
    if (nonce.length != HASH_LENGTH_BYTES) {
        throw new Error()
    }
    const result = new Uint8Array(input.length + HASH_LENGTH_BYTES)
    const resultData = result.subarray(HASH_LENGTH_BYTES)
    resultData.set(input)
    result.set(nonce)
    const randomArray = randomUint8Array(nonce, input.length)
    xorToFirstParam(resultData, randomArray)
    return result
}

function deRandomize(input: Uint8Array): Uint8Array {
    if (input.length < HASH_LENGTH_BYTES) {
        throw new Error()
    }
    const nonce = input.subarray(0, HASH_LENGTH_BYTES)
    const randomizedBytes = input.subarray(HASH_LENGTH_BYTES)
    const result = new Uint8Array(randomizedBytes)
    const randomArray = randomUint8Array(nonce, randomizedBytes.length)
    xorToFirstParam(result, randomArray)
    return result
}

function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length);
    result.set(a)
    xorToFirstParam(result, b)
    return result
}

function xorToFirstParam(a: Uint8Array, b: Uint8Array): void {
    if (a.length !== b.length) {
        throw new Error(`Different length ${a.length}, ${b.length}.`)
    }
    a.forEach((element, index) => {
        a[index] = element ^ b[index]
    })
}

export const forTesting = {
    prependHash,
    verifyHash,
    toBinary,
    toString,
    randomize,
    deRandomize
}


main()