// @flow
declare var crypto: {subtle:any}

/** in bytes */
const INIT_VECTOR_LENGTH = 256 / 8

const KEY_DERIVATION_SALT = 'key derivation salt'

// file format version(4B),encrypted blob

function toBinary(text:string): Uint8Array {
    return new TextEncoder('utf-8') // TODO remove constructor param
        .encode(text)
}

async function toCryptoKey(password:string): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', toBinary(password), {name: 'PBKDF2'}, false, ['deriveBits', 'deriveKey'])
}

export async function encrypt(password:string, cleartext:Uint8Array) {
    const binaryPasswordKey = await toCryptoKey(password)
    const key = await crypto.subtle.deriveKey({
            "name": 'PBKDF2',
            "salt": toBinary(KEY_DERIVATION_SALT),
            "iterations": 100,
            "hash": 'SHA-256'
        },
        binaryPasswordKey,
        // For AES the length required to be 128 or 256 bits (not bytes)
        { "name": 'AES-CTR', "length": 256 },
        true, // extractabe
        // this web crypto object will only be allowed for these functions
        [ "encrypt", "decrypt" ]);
    return crypto.subtle.encrypt({"name": "AES-CTR", counter, length}, key, cleartext)
}

export function decrypt(password:string, blob:Uint8Array) {

}

function parseBlob(blob: Uint8Array): {initVector: Uint8Array, cryptoText: Uint8Array} {
    return {
        initVector: blob.subarray(0, INIT_VECTOR_LENGTH),
        cryptoText: blob.subarray(INIT_VECTOR_LENGTH)
    }
}

declare interface CryptoKey {}

function main() {
    encrypt('ahoj', toBinary('svete'))
        .then(cryptotext =>console.log(cryptotext))
}

main()