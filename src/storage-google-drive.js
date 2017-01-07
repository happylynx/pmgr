// @flow

import type {Gapi} from './external'
import multipart from './multipart'

declare var gapi: Gapi

// workaround https://github.com/babel/babel/issues/5032
function* _dummy() {}

const FILE_NAME = 'pmgr-container.bin'
const CLIENT_ID = '58468353349-3kmjikbb3p50dcq0uondosut4aau97sj.apps.googleusercontent.com'
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata']

let fileIdCache: ?string = null

/**
 * temporary long function
 */
function l(...messages) {
    console.log(...messages)
}

/**
 * 1. it makes sure that user is logged in and optionally pops up login window
 * 2. it tries to download the file
 *   1. if it doesn't exist, it stores an empty one an return empty array
 *   2. otherwise content of the file is returned
 */
async function loadFile(createNewFileContent: () => Promise<Uint8Array>): Promise<Uint8Array> {
    l('loadFile', 1)
    await getApiReady()
    l('loadFile', 2)
    if (fileIdCache == null) {
        l('loadFile', 3.1)
        fileIdCache = await findFile(createNewFileContent)
        l('loadFile', 3.2)
    }
    l('loadFile', 4)
    // TODO delete this branch probably
    if (fileIdCache == null) {
        l('loadFile', 5.1)
        const fileContent = await createNewFileContent()
        l('loadFile', 5.2)
        fileIdCache = await saveNewFile(fileContent)
        l('loadFile', 5.3)
        return fileContent
    }
    l('loadFile', 6)
    const content = getFileById(fileIdCache)
    l('loadFile', 7)
    return content
}

/**
 * 1. it makes sure that user is logged in and optionally pops up login window
 * 2. gets file id by name
 * 3. if file doesn't exist, it creates new one
 * 4. file content is updated
 */
async function saveFile(content: Uint8Array): Promise<void> {
    await getApiReady()
}

/**
 * @param fileId
 * @return {Promise.<Uint8Array>} file content
 */
async function getFileById(fileId: string): Uint8Array {
    gapi.client.drive.files.get({
        fileId: fileId,
        encoding: null
    })
        .then(result => console.log(`get file id=${fileId}`, result),
            error => console.warn(`error getting file id=${fileId}`, error))
}

/**
 * Creates new file when it's known there is no file existing
 * @param fileContent content of new file
 * @return {Promise.<string>} id of new file
 */
// TODO remove
async function saveNewFile(fileContent: Uint8Array): Promise<string> {
    await fireCreateFileRequest(fileContent)
    const files = await getAllFiles()
    if (files.length === 0) {
        throw new Error('Creation of new file failed.')
    }
    if (files.length > 1) {
        const oldestFile = await deleteNewerFiles(files)
        return oldestFile.id // TODO check
    }
    return files[0].id // TODO check
}

interface DriveFile {
    id: string,
    name: string,
    createdTime: mixed
}

async function getAllFiles(): Promise<Array<DriveFile>> {
    return new Promise((resolve, reject) => {
        const request = gapi.client.drive.files.list({
            'pageSize': 10,
            'fields': 'nextPageToken, files(id, name, createdTime)',
            'spaces': 'appDataFolder',
            q: `name = '${FILE_NAME}'`
        });
        request.then(
            response => {
                console.log('getAllFiles response', response)
                resolve(response.result.files)
            },
            error => {
                console.log('getAllFiles response', error)
                reject(error)
            }
        )
    }).then(files => {
        console.log('getAllFiles', files)
        return files
    })
}

/**
 *
 * @param files
 * @return {Promise.<string>} oldest file id
 */
async function removeExceptOldest(files: Array<DriveFile>): Promise<string> {
    return {} // TODO
}

/**
 * @return {Promise.<?string>} file id or `null` if file doesn't exist
 */
async function findFile(createNewFileContent: ?(() => Promise<Uint8Array>)): Promise<string> {
    const allFiles = await getAllFiles()
    if (allFiles.length === 0) {
        if (!createNewFileContent) {
            throw new Error('Failed to create file.')
        }
        return await createFile(createNewFileContent)
    }
    if (allFiles.length > 1) {
        return await removeExceptOldest(allFiles)
    }
    return allFiles[0].id
}

async function createFile(createNewFileContent: () => Promise<Uint8Array>): Promise<string> {
    // TODO remove try catch block
    try {
        const fileContent = await createNewFileContent()
        await fireCreateRequest(fileContent)
        return await findFile(null)
    } catch (err) {
        console.error('createFile exception', err)
        throw err
    }
}

async function fireCreateRequest(fileContent: Uint8Array): Promise<string> /*file id*/ {
    return new Promise((resolve, reject) => {
        const {separator, body} = multipart({
                name: 'uploadedFile',
                parents: ['appDataFolder']
            },
            binaryToString(fileContent),
            'application/octet-stream'
        )
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
        request.then(
            response => {
                console.log('response of fileCreateRequest', response)
                resolve('') // TODO
            }, error => {
                console.log('error of fileCreateRequest', error)
                reject(error)
            }
        )
    })
}

function binaryToString(binary: Uint8Array): string {
    return String.fromCharCode.apply(null, binary)
}

/**
 * It makes sure that user is logged in (optionally it pops up login dialog) and that
 * the drive api is loaded
 */
function getApiReady(): Promise<void> {
    l('getApiReady', 1)
    return new Promise((resolve, reject) => {
        l('getApiReady', 2)
        try {
            gapi.auth.authorize({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    immediate: false
                },
                authResult => {
                    l('getApiReady', 3)
                    if (authResult.error) {
                        l('getApiReady', 4)
                        reject(authResult.error)
                        l('getApiReady', 5)
                        return;
                    }
                    l('getApiReady', 6)
                    gapi.client.load('drive', 'v3', () => {
                        l('getApiReady', 7)
                        resolve()
                    });
                    l('getApiReady', 8)
                });
        } catch (err) {
            console.error('error in getApiReady', err)
            l('getApiReady', 9)
        }
    })
}

module.exports = {
    loadFile,
    saveFile
}