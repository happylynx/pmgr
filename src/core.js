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

const KEY_DERIVATION_SALT = 'key derivation salt'

const FORMAT_VERSION = 1
const BINARY_FORMAT_VERSION = (() => {
    const result = new Uint8Array(4)
    new DataView(result.buffer).setUint32(0, FORMAT_VERSION)
    return result
})()
const FILE_MAGIC_NUMBER = toBinary('pmgr')

const HASH_LENGTH_BYTES = 64
const ENCRYPTION_NONCE_LENGTH_BYTES = 16

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

async function encryptParametrized(password:string,
                                          cleartext:Uint8Array,
                                          nonce: Uint8Array): Promise<Uint8Array> {
    if (nonce.length != ENCRYPTION_NONCE_LENGTH_BYTES) {
        throw new Error()
    }
    const binaryPasswordKey = await toCryptoKey(password)
    const key = await deriveKey(binaryPasswordKey);
    const counter = new Uint8Array(nonce); // AES-CTR requires 16B
    const cryptotext = await crypto.subtle.encrypt({"name": "AES-CTR", counter, length: 24}, key, cleartext)
    return new Uint8Array(cryptotext)
}

async function decryptParametrized(password: string,
                                          cryptoText: Uint8Array,
                                          nonce: Uint8Array): Promise<Uint8Array> {
    const binaryPasswordKey = await toCryptoKey(password)
    const key = await deriveKey(binaryPasswordKey);
    const counter = new Uint8Array(ENCRYPTION_NONCE_LENGTH_BYTES); // AES-CTR requires 16B
    counter.set(nonce);
    const decryptedBuffer:ArrayBuffer = await crypto.subtle.decrypt(
        {"name": "AES-CTR", counter, length: 24},
        key,
        cryptoText)
    return new Uint8Array(decryptedBuffer)
}

function concat(...typedArrays: Array<Uint8Array>): Uint8Array {
    const resultLength = typedArrays.reduce((sum, current) => sum + current.byteLength, 0)
    const result = new Uint8Array(resultLength)
    let startingOffset = 0
    typedArrays.forEach(array => {
        result.set(array, startingOffset)
        startingOffset += array.byteLength
    })
    return result
}

// TODO externalize type definitions
declare interface CryptoKey {}

function prependHashBinary(input: Uint8Array): Uint8Array {
    const hash = new Uint8Array(sha3_512.arrayBuffer(input))
    const result = new Uint8Array(hash.length + input.length)
    result.set(hash)
    result.set(input, hash.length)
    return result
}

function verifyHashBinary(hashAndData: Uint8Array): ?Uint8Array {
    const originalHash = hashAndData.subarray(0, HASH_LENGTH_BYTES)
    const data = hashAndData.subarray(HASH_LENGTH_BYTES)
    const newHash = new Uint8Array(sha3_512.arrayBuffer(data))
    const isHashValid = equalUint8Array(originalHash, newHash)
    return isHashValid ? new Uint8Array(data) : null;
}

function equalUint8Array(a: Uint8Array, b: Uint8Array): boolean {
    if (!(a instanceof Uint8Array)) {
        return false
    }
    if (!(b instanceof Uint8Array)) {
        return false
    }
    if (a === b) {
        return true
    }
    if (a.length != b.length) {
        return false
    }
    return a.every((element, index) => element === b[index])
}

function* createRandomIterator(nonce: Uint8Array): Iterator<number> {
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
        blockToHashView.setInt32(0, blockIndex)
        const hashArrayBuffer = sha3_512.arrayBuffer(blockToHash)
        const hashArray = new Uint8Array(hashArrayBuffer)
        yield* hashArray
    }
}

function takeUint8(iterator: Iterator<number>, count: number): Uint8Array {
    const result = new Uint8Array(count)
    return result.map((_, index) => {
        const iteratorResult: IteratorResult<number, void> = iterator.next()
        // this `if` branch is there just to satisfy flow type checker
        if (iteratorResult.done) {
            throw new Error()
        }
        return iteratorResult.value
    })
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

/**
 * The function to use
 * @param password
 * @param plaintext
 */
export async function encrypt(password: string, plaintext: string): Promise<Uint8Array> {
    const binaryPlaintext = toBinary(plaintext)
    const hashAndPlaintext = prependHashBinary(binaryPlaintext)
    const randomizedPlaintext = randomize(hashAndPlaintext)
    const encryptionNonce = new Uint8Array(ENCRYPTION_NONCE_LENGTH_BYTES)
    window.crypto.getRandomValues(encryptionNonce)
    const encrypted = await encryptParametrized(password, randomizedPlaintext, encryptionNonce)
    const result = concat(FILE_MAGIC_NUMBER, BINARY_FORMAT_VERSION, encryptionNonce, encrypted)
    return result
}

export async function decrypt(password: string, encryptedContainer: Uint8Array): Promise<string> {
    const magicNumberOffset = 0
    const magicNumberLength = FILE_MAGIC_NUMBER.length
    const formatVersionOffset = magicNumberOffset + magicNumberLength
    const formatVersionLength = BINARY_FORMAT_VERSION.length
    const encryptionNonceOffset = formatVersionOffset + formatVersionLength
    const encryptionNonceLength = ENCRYPTION_NONCE_LENGTH_BYTES
    const encryptedDataOffset = encryptionNonceOffset + encryptionNonceLength

    const magicNumber = encryptedContainer.subarray(magicNumberOffset, magicNumberOffset + magicNumberLength)
    const formatVersion = encryptedContainer.subarray(formatVersionOffset, formatVersionOffset + formatVersionLength)
    const encryptionNonce = encryptedContainer.subarray(encryptionNonceOffset, encryptionNonceOffset + encryptionNonceLength)
    const encryptedData = encryptedContainer.subarray(encryptedDataOffset)
    if (!equalUint8Array(magicNumber, FILE_MAGIC_NUMBER)) {
        throw new AppError('MAGIC_NUMBER_MISMATCH')
    }
    if (!equalUint8Array(formatVersion, BINARY_FORMAT_VERSION)) {
        throw new AppError('CONTAINER_FORMAT_NUMBER_MISMATCH')
    }
    const plaintext = await decryptParametrized(password, encryptedData, encryptionNonce)
    const deRandomized = deRandomize(plaintext)
    const binaryData = verifyHashBinary(deRandomized)
    if (binaryData == null) {
        throw new AppError('HASH_VERIFICATION_FAILED')
    }
    const textData = toString(binaryData)
    return textData
}

type ErrorKey = 'HASH_VERIFICATION_FAILED'
    | 'CONTAINER_FORMAT_NUMBER_MISMATCH'
    | 'MAGIC_NUMBER_MISMATCH'

class AppError {

    key: ErrorKey
    details: Object
    error: Error

    constructor(key: ErrorKey, details: ?Object) {
        this.key = key
        this.details = details || {}
        this.error = new Error()
    }

    toString() {
        return `${this.key} details=${JSON.stringify(this.details)} error=${errorToString(this.error)}`
    }

    toJSON() {
        return this.toString()
    }
}

function errorToString(error: Error): string {
    const propertiesToPrint = ['fileName', 'lineNumber', 'columnNumber', 'message', 'stack']
    const description = propertiesToPrint.map(property => getPropertyIfExists(property, error))
        .join(', ')
    return `{Error ${description}}`
}

function getPropertyIfExists(propertyName: string, object: Object): string {
    return (propertyName in object)
        ? `${propertyName}=${object[propertyName]}`
        : ''
}

export const forTesting = {
    toBinary,
    randomize,
    deRandomize,
    verifyHashBinary,
    prependHashBinary,
    randomUint8Array
}