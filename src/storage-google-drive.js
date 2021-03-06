// @flow

import type {Gapi} from './external'
import * as utils from './utils'

declare var gapi: Gapi

// workaround https://github.com/babel/babel/issues/5032
function* _dummy() {}

const FILE_NAME = 'pmgr-container.bin'
const APP_DIRECTORY_NAME = 'appDataFolder'
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
export async function loadFile(createNewFileContent: () => Promise<Uint8Array>): Promise<Uint8Array> {
    await getApiReady()
    if (fileIdCache == null) {
        fileIdCache = await findFile(createNewFileContent)
    }
    const content = getFileById(fileIdCache)
    return content
}

/**
 * 1. it makes sure that user is logged in and optionally pops up login window
 * 2. gets file id by name
 * 3. if file doesn't exist, it creates new one
 * 4. file content is updated
 */
export async function saveFile(content: Uint8Array): Promise<void> {
    await getApiReady()
    if (fileIdCache == null) {
        fileIdCache = await findFile(() => Promise.resolve(content))
    }
    await fireUpdateRequestFetch(fileIdCache, content)
}

export function removeFile(fileId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        gapi.client.drive.files.delete({
            fileId: fileId
        }).then(response => {
            console.log(`file deleted id=${fileId}`, response)
            resolve()
        }, error => {
            console.log(`file deletion failed id=${fileId}`, error)
            reject(error)
        })
    })
}

function fireUpdateRequestFetch(fileId: string, content: Uint8Array): Promise<void> {
    const headers = new Headers({
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${gapi.auth.getToken().access_token}`
    })
    const options = {
        method: 'PATCH',
        mode: 'cors',
        headers,
        body: content
    }
    return fetch(`https://content.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, options)
        .then(response => {
            console.log('file update succeeded', fileId, content, response)
        })
        .catch(error => {
            console.log('file update failed', fileId, content, error)
            throw error
        })
}

/**
 * @param fileId
 * @return {Promise.<Uint8Array>} file content
 */
function getFileById(fileId: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        gapi.client.drive.files.get({
            fileId: fileId,
            encoding: null,
            alt: 'media'
        }).then(response => {
            const binaryHoldingString = response.body
            const binary = utils.stringToBinary(binaryHoldingString)
            console.log(`get file id=${fileId}`, response, 'file content', binary,
                'content length', binaryHoldingString.length, binary.length)
            resolve(binary)
        }, error => {
            console.warn(`error getting file id=${fileId}`, error)
            reject(error)
        })
    })
}

interface DriveFile {
    id: string,
    name: string,
    createdTime: mixed
}

export async function getAllFiles(): Promise<Array<DriveFile>> {
    return new Promise((resolve, reject) => {
        const request = gapi.client.drive.files.list({
            'pageSize': 10,
            'fields': 'nextPageToken, files(id, name, createdTime)',
            'spaces': APP_DIRECTORY_NAME,
            q: `name = '${FILE_NAME}'`
        });
        request.then(
            response => {
                console.log('getAllFiles response', response)
                resolve(response.result.files)
            },
            error => {
                console.log('getAllFiles error', error)
                reject(error)
            }
        )
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
    const fileContent = await createNewFileContent()
    await fireCreateRequest(fileContent)
    return await findFile(null)
}

/**
 * @param fileContent
 * @return {Promise<string>} file id
 */
async function fireCreateRequest(fileContent: Uint8Array): Promise<string> /*file id*/ {
    return new Promise((resolve, reject) => {
        const {separator, body} = utils.multipart({
                name: FILE_NAME,
                parents: [APP_DIRECTORY_NAME],
                encoding: null
            },
            utils.binaryToString(fileContent),
            'application/octet-stream',
            'binary'
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
                console.log('response of fileCreateRequest', response, 'file content', fileContent)
                resolve(response.result.id)
            }, error => {
                console.log('error of fileCreateRequest', error)
                reject(error)
            }
        )
    })
}

/**
 * It makes sure that user is logged in (optionally it pops up login dialog) and that
 * the drive api is loaded
 */
function getApiReady(): Promise<void> {
    return new Promise((resolve, reject) => {
        gapi.auth.authorize({
                client_id: CLIENT_ID,
                scope: SCOPES,
                immediate: false
            },
            authResult => {
                if (authResult.error) {
                    reject(authResult.error)
                    return;
                }
                gapi.client.load('drive', 'v3', () => {
                    l('getApiReady', 'drive lib loaded')
                    resolve()
                });
            });
    })
}