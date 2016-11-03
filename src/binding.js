// @flow

declare interface JquerySelection {
    val():string,
    click(callback: Function): void
}

declare var $: (selection: Function|string) => JquerySelection
declare var gapi: Object
declare var window

import * as cryptolib from './browser'

const CLIENT_ID = '58468353349-3kmjikbb3p50dcq0uondosut4aau97sj.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly'

$(init)

function init() {
    $('#encrypt').click(encrypt)
    $('#signin').click(signin)
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

function signin() {
    console.log('signin button')
    gapi.auth.authorize(
        {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
        handleAuthResult);
}

function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
        console.log('logged in')
    } else {
        console.log('not logged in')
    }
}

function checkAuth() {
    console.log('gapi', gapi)
    gapi.auth.authorize(
        {client_id: CLIENT_ID, scope: SCOPES, immediate: true},
        handleAuthResult);
}
window.checkAuth = checkAuth