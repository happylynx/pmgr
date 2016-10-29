import {encrypt} from './main'

test('true test', () => {
    expect(true).toBe(true);
    debugger;
    expect(encrypt('ahoj', new Uint8Array(64), 'ahoj svete')).toBe('qwe');
})