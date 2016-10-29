'use strict';

import {sha3_512} from 'js-sha3'
import utf8Encoder from 'utf8-encoder'

import {hashFn, concat, xor, toBinary, ensure} from './utils'

/**
 * Block lenght in bytes
 * @type {number}
 */
const BLOCK_LENGTH = 512 / 8;

/**
 * Number of key generation iterations
 * @type {number}
 */
const KEY_GENERATION_ITERATIONS = 50;

/**
 *
 * @param {string} password
 * @param {Uint8Array} initializationVector
 * @return {Uint8Array} key of byte-length {@link KEY_GENERATION_ITERATIONS}
 */
function generateKey(password, initializationVector) {
    const blocks = new Uint8Array(BLOCK_LENGTH * KEY_GENERATION_ITERATIONS);
    let activeLength = 0;
    const firstBlock = hashFn(password + 'magic string');
    blocks.set(firstBlock, activeLength);
    activeLength += firstBlock.length;
    [...new Array(KEY_GENERATION_ITERATIONS - 1).keys()].forEach(() => {
        const hash = hashFn(concat(initializationVector, blocks.subarray(0, activeLength)));
        blocks.set(hash, activeLength);
        activeLength += hash.length;
    });
    return hashFn(blocks);
}

/**
 *
 * @param {number} blockIndex zero based block index
 * @param {Uint8Array} key global key
 * @param {Uint8Array} initializationVector
 * @return {Uint8Array} block key
 */
function getBlockKey(blockIndex, key, initializationVector) {
    const indexBlock = utf8Encoder.fromString(Number.prototype.toString.call(blockIndex));
    return hashFn(concat(hashFn(concat(key, indexBlock)), initializationVector));
}

/**
 * @param {string} password
 * @param {Uint8Array|string} initialRandomness initialization vector or any string as source of randomness for creation
 *                            of initialization vector
 * @param {Uint8Array|string} plaintext
 * @return {Uint8Array} cryptotext
 */
export function encrypt(password, initialRandomness, plaintext) {
    const binaryPlaintext = toBinary(plaintext)
    const binaryToEncrypt = concat(hashFn(binaryPlaintext), binaryPlaintext)
    return encrypt(password, initialRandomness, binaryToEncrypt)
}

/**
 * @see {@link encrypt}
 */
export function encryptWithoutVerification(password, initialRandomness, plaintext) {
    const initializationVector = isString(initialRandomness) ? hashFn(initialRandomness) : initialRandomness
    const binaryPlaintext = toBinary(plaintext)
    const key = generateKey(password, initializationVector);
    const byteKeyProvider = createByteKeyProvider(createBlockKeyProvider(key, initializationVector));
    return binaryPlaintext.map(byte => byte ^ byteKeyProvider());
}

export function decrypt() {}



/**
 * @callback TypedArrayProvider
 * @return {Uint8Array}
 */

/**
 *
 * @param key
 * @param initializationVector
 * @return {TypedArrayProvider}
 */
function createBlockKeyProvider(key, initializationVector) {
    let blockIndex = 0;
    return () => {
        const blockKey = getBlockKey(blockIndex, key, initializationVector);
        blockIndex += 1;
        return blockKey;
    };
}

/**
 *
 * @param {TypedArrayProvider} blockKeyProvider
 * @return {TypedArrayProvider}
 */
function createByteKeyProvider(blockKeyProvider) {
    let offset = 0;
    let block = blockKeyProvider();
    return () => {
        const byte = block[offset];
        offset += 1;
        if (offset > block.length) {
            offset = 0;
            block = blockKeyProvider();
        }
        return byte;
    };
}
