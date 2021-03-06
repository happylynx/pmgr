// @flow

declare interface JquerySelection {
    val():string,
    click(callback: Function): void,
    append(element: JquerySelection): JquerySelection
}

declare var $: (selection: Function|string) => JquerySelection
declare var gapi: Object
declare var window

import * as cryptolib from './core'
import * as storage from './storage-google-drive'
import * as utils from './utils'

// workaround https://github.com/babel/babel/issues/5032
function* _dummy() {}

const CLIENT_ID = '58468353349-3kmjikbb3p50dcq0uondosut4aau97sj.apps.googleusercontent.com'
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata']

$(init)

function init() {
    $('#encrypt').click(encrypt)
    $('#signin').click(signin)
    $('#list-pmgr').click(listPmgrFile)
    $('#upload-pmgr').click(uploadPmgrFile)
    $('#custom-action').click(customAction)
    addOtherButtons()
}

function addOtherButtons() {
    const actions = {
        'multipart upload create': function() {
            console.log('multipart')
            const {separator, body} = multipart({
                name: 'uploadedFile',
                parents: ['appDataFolder']
            }, "hello world 2")
            const request = gapi.client.request({
                path: 'https://www.googleapis.com/upload/drive/v3/files',
                method: 'POST',
                params: {
                    uploadType: 'multipart'
                },
                headers: {
                    'Content-Type': `multipart/mixed; boundary=${separator}`
                },
                body
            });
            request.execute((r1, r2) => {
                console.log('custom action executed')
                console.log(r1)
                console.log(typeof r2, r2)
                window.a = r2
            })
        },
        'list app dir': function() {
            gapi.client.drive.files.list({
                spaces: 'appDataFolder',
                fields: 'nextPageToken, files(id, name, parents)'
            })
                .execute(response => console.log('list reponse', response))
        },
        'read app file metadata': function() {
            const fileId = window.prompt('Enter file id')
            const valid = validateFileId(fileId)
            if (!valid) {
                console.warn(`File id ${fileId} is not valid.`)
                return;
            }
            gapi.client.drive.files.get({
                fileId: fileId,
                fields: 'name, size, id'
            })
                .then(result => console.log(`get file id=${fileId}`, result),
                    error => console.warn(`error getting file id=${fileId}`, error))
        },
        'read app file content': function() {
            const fileId = window.prompt('Enter file id')
            const valid = validateFileId(fileId)
            if (!valid) {
                console.warn(`File id ${fileId} is not valid.`)
                return;
            }
            gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            })
                .then(result => console.log(`get file id=${fileId}`, result),
                    error => console.warn(`error getting file id=${fileId}`, error))
        },
        'update file content': function() {
            const fileId = window.prompt('Enter file id')
            const valid = validateFileId(fileId)
            if (!valid) {
                console.warn(`File id ${fileId} is not valid.`)
                return;
            }
            const content = window.prompt('Enter file content')
            if (content === null) {
                console.log('file content update cancelled')
                return
            }
            const request = gapi.client.request({
                path: 'https://www.googleapis.com/upload/drive/v3/files/' + fileId,
                method: 'PATCH',
                params: {
                    uploadType: 'media'
                },
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                // body: content
                body: new Uint8Array([0, 1, 245])
            });
            request.then(result => console.log(`update file id=${fileId}`, result),
                error => console.warn(`error updating file id=${fileId}`, error))
        },
        'list file revisions': function() {
            const fileId = window.prompt('Enter file id')
            const valid = validateFileId(fileId)
            if (!valid) {
                console.warn(`File id ${fileId} is not valid.`)
                return;
            }
            gapi.client.drive.revisions.list({
                fileId: fileId
            }).then(result => console.log(`revisions for file id=${fileId}`, result),
                error => console.warn(`error listing revisions of file id=${fileId}`, error))
        },
        'get file revision content': function() {
            const fileId = window.prompt('Enter file id')
            const valid = validateFileId(fileId)
            if (!valid) {
                console.warn(`File id ${fileId} is not valid.`)
                return;
            }
            const revisionId = window.prompt('Enter revision id')
            gapi.client.drive.revisions.get({
                fileId: fileId,
                revisionId: revisionId,
                alt: 'media'
            }).then(result => console.log(`revision id=${revisionId} of file id=${fileId}`, result),
                error => console.warn(`error getting revision id=${revisionId} of file id=${fileId}`, error))
        },
        '* save': function () {
            const plainText = $('#plaintext').val()
            const password = $('#password').val()
            cryptolib.encrypt(password, plainText)
                .then(cryptoText => storage.saveFile(cryptoText))
                .then(() => console.log('* saved'))
                .catch(error => console.log('* saving failed', error))
        },
        '* load': function () {
            const password = $('#password').val()
            const createFileContent = createCreateNewFileContent(password)
            storage.loadFile(createFileContent)
                .then(cryptoText => cryptolib.decrypt(password, cryptoText))
                .then(plainText => {
                    $('#plaintext').val(plainText)
                    console.log('* loaded')
                })
                .catch(error => console.log('* loading failed', error))
        },
        'async error test': function () {
            c()
                .then(result => {console.log('first then', result); return result})
                .then(_ => console.log('second then'))
                .catch(err => console.error('catch method:', err))
        },
        'delete file': function() {
            const fileId = window.prompt('Enter file id')
            const valid = validateFileId(fileId)
            if (!valid) {
                console.warn(`File id ${fileId} is not valid.`)
                return;
            }
            storage.removeFile(fileId)
        },
        'delete all pmgr files': async function () {
            const pmgrFiles = await storage.getAllFiles()
            console.log('files to delete:', pmgrFiles)
            pmgrFiles.forEach(file => storage.removeFile(file.id))
        },
        'raw load': async function () {
            const binaryContent = await storage.loadFile(() => Promise.resolve(new Uint8Array([])))
            const stringContent = utils.binaryToString(binaryContent)
            $('#plaintext').val(stringContent)
            console.log('raw load', binaryContent, stringContent)
        },
        'raw save': async function () {
            const stringContent = $('#plaintext').val()
            const binaryContent = utils.stringToBinary(stringContent)

            const alternativeBinary = new Uint8Array([254, 255])
            console.log(utils.binaryToString(alternativeBinary))
            await storage.saveFile(alternativeBinary)
            console.log('raw save done', binaryContent, stringContent)
        }
    }
    const parent = $('#other-actions')
    Object.keys(actions).forEach(key => {
        const button = $(`<button>${key}</button>`)
        button.click(actions[key])
        parent.append(button)
    })
}

async function a() {
    throw '<error in async function>'
}

async function b() {
    await a()
    return 'b result'
}

async function c() {
    await b()
    return 'c result'
}

function createCreateNewFileContent(password: string): () => Promise<Uint8Array> {
    return async function () {
        return await cryptolib.encrypt(password, '')
    }
}

function validateFileId(fileId: string): boolean {
    return /[\w\d-_]{44}/.test(fileId)
}

function multipart(properties: Object, data: string): {body: string, separator: string} {
    const separator = createSeparator()
    let result = `--${separator}\nContent-Type: application/json; charset=UTF-8\n\n${JSON.stringify(properties)}\n\n`
    result += `--${separator}\nContent-Type: text/plain; charset=UTF-8\n\n${data}\n`;
    result += `--${separator}--\n`
    return {
        separator,
        body: result
    }
}

function createSeparator(): string {
    return `#${take(randomChars(), 32).join('')}#`
}


function* randomChars(): Generator<string, void, void> {
    while (true) {
        yield* Math.floor(Number.MAX_SAFE_INTEGER * Math.random()).toString(36)
    }
}

function take<T>(iterable: Iterable<T>, count: number): Array<T> {
    let counter = 0;
    const result = []
    for (let i of iterable) {
        result.push(i)
        counter++
        if (counter >= count) {
            break;
        }
    }
    return result
}

function listPmgrFile() {
    const request = gapi.client.drive.files.list({
        q: 'name = \'pmgr\'',
        fields: 'nextPageToken, files(id, name)'
    });
    request.execute(response => console.log('list reponse', response))
}

function uploadPmgrFile() {
    createFile();
}

function createFile() {
    gapi.client.drive.files.create({
        resource: {
            name: 'pmgr-file',
            parents: ['appDataFolder']
        },
        media: {
            mimeTypes: 'application/octet-stream',
            body: 'a'
        },
        fields: ['id']
    }).execute(resp => console.log(resp))
}

function encrypt() {
    const clearText = $('#plaintext').val()
    const password = $('#password').val()
    if (password.length === 0) {
        console.warn('Some implementations of `crypto.subtle.importKey` (e.g. Firefox) doesn\'t allow empty passwords.')
        return;
    }
    cryptolib.encrypt(password, clearText)
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
        loadDriveApi();
    } else {
        console.log('not logged in')
    }
}

function loadDriveApi() {
    gapi.client.load('drive', 'v3', listFiles);
}

function customAction() {
    const request = gapi.client.request({
        path: 'https://www.googleapis.com/upload/drive/v3/files',
        method: 'POST',
        params: {
            uploadType: 'media'
        },
        headers: {
            'Content-Type': 'text/plain'
        },
        body: 'hello world'
    });
    request.execute((r1, r2) => {
        console.log('custom action executed')
        console.log(r1)
        console.log(typeof r2, r2)
        window.a = r2
    })
}


function listFiles() {
    var request = gapi.client.drive.files.list({
        'pageSize': 10,
        'fields': 'nextPageToken, files(id, name)',
        'spaces': 'appDataFolder'
    });

    request.execute(function(resp) {
        console.log('listed files', resp.files)
        if (!resp.files) {
            return
        }
        resp.files.forEach(file => console.log('file', file.name, file.id, file))
    });
}



function checkAuth() {
    console.log('gapi', gapi)
    gapi.auth.authorize(
        {client_id: CLIENT_ID, scope: SCOPES, immediate: true},
        handleAuthResult);
}
window.checkAuth = checkAuth