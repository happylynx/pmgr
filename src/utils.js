'use strict';

import {sha3_512} from 'js-sha3'
import utf8Encoder from 'utf8-encoder'

/**
 * @param {Uint8Array} a input
 * @param {Uint8Array} b input
 * @return {Uint8Array} a xor b
 */
export function xor(a, b) {
    if (a.byteLength !== b.byteLength) {
        throw new Error('Operands are not of the same length.');
    }
    return a.map((element, index) => element ^ b[index]);
}

export function hashFn(content) {
    const arrayBufferHash = sha3_512.arrayBuffer(toBinary(content));
    return new Uint8Array(arrayBufferHash);
}

export function isString(obj) {
    return typeof obj === 'string' || obj instanceof String
}

export function toBinary(object) {
    if (isString(object)) {
        return utf8Encoder.fromString(object)
    }
    if (object instanceof Uint8Array) {
        return object
    }
    throw new Error(`Object of unexpected type: ${object}`)
}

export function ensure(condition, message) {
    if (!condition) {
        throw new Error(`ensure: ${message}`);
    }
}

/**
 *
 * @param first
 * @param others
 * @return {Uint8Array} concatenated arrays
 */
export function concat(first, ...others) {
    const allArrays = [first, ...others];
    const finalLength = allArrays.reduce((sum, array) => sum + array.length, 0);
    const result = new Uint8Array(finalLength);
    let appendOffset = 0;
    allArrays.forEach((array) => {
        debugger;
        result.set(array, appendOffset);
        appendOffset += array.length;
    });
    return result;
}

