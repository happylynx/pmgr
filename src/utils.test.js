import {xor, concat, hashFn} from "./utils";

describe('xor', () => {
    test('zeros', () => {
        const a = new Uint8Array([0]);
        const b = new Uint8Array([0]);

        expect(xor(a, b)).toEqual(new Uint8Array([0]))
    })

    test('different length', () => {
        const a = new Uint8Array([0]);
        const b = new Uint8Array([0, 1]);

        expect(() => xor(a, b)).toThrowError('Operands are not of the same length.')
    })
})

describe('concat', () => {
    it('3 arguments', () => {
        expect(concat(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])))
            .toEqual(new Uint8Array([1, 2, 3]))
    })
})

describe('hashFn', () => {
    it('string a', () => {
        expect(hashFn('a'))
            .toEqual(new Uint8Array([105, 127, 45, 133, 97, 114, 203, 131, 9, 214, 184, 185, 125, 172, 77, 227, 68, 181, 73, 212, 222, 230, 30, 223, 180, 150, 45, 134, 152, 183, 250, 128, 63, 79, 147, 255, 36, 57, 53, 134, 226, 139, 91, 149, 122, 195, 209, 211, 105, 66, 12, 229, 51, 50, 113, 47, 153, 123, 211, 54, 208, 154, 176, 42]))
    })

    it('typed array [0, 1]', () => {
        expect(hashFn(new Uint8Array([0,1])))
            .toEqual(new Uint8Array([35,165,116,62,164,19,104,16,162,221,80,50,82,112,141,53,21,18,89,200,89,188,183,172,70,245,241,32,66,153,131,209,71,54,255,190,198,191,143,23,73,119,180,75,12,91,115,55,142,168,138,78,193,247,170,41,92,4,181,219,144,23,202,72]))
        console.log('crypto', window.crypto)
    })
})