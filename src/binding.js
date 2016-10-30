// @flow

declare interface JquerySelection {
    val():string,
    click(callback: Function): void
}

declare var $: (selection: Function|string) => JquerySelection

import * as cryptolib from './browser'

console.log($)
$(init)

function init() {
    $('#encrypt').click(encrypt)
}

function encrypt() {
    const clearText = $('#plaintext').val()
    const password = $('#password').val()
    if (password.length === 0) {
        console.warn('Some implementations of `crypto.subtle.importKey` (e.g. Firefox) doesn\'t allow empty passwords.')
        return;
    }
    cryptolib.completeEncrypt(password, clearText)
        .then(cryptoText => console.log(cryptoText))
        .catch(console.log.bind(console))
}