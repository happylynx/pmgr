
import utf8Encoder from 'utf8-encoder'
import {xor, toBinary} from './utils'


const a = "ahoj svete "
const b = "ahoj"

const aBin = toBinary(a)
const bBin = toBinary(b)

const [aNorm, bNorm] = normalizeLength(aBin, bBin)
const xored = xor(aNorm, bNorm)
const xorString = utf8Encoder.toString(xored)

console.log('a', a)
console.log('b', b)
console.log('aBin', aBin)
console.log('bBin', bBin)
console.log('xor ', xored)
console.log('string xor', xorString)

function normalizeLength(aBin, bBin) {
    if (aBin.length === bBin.length) {
        return [aBin, bBin]
    }
    if (aBin.length > bBin.length) {
        return [aBin, extend(bBin, aBin.length)]
    }
    return [extend(aBin, bBin.length), bBin]
}

function extend(array, length) {
    const result = new Uint8Array(length)
    result.set(array)
    return result
}