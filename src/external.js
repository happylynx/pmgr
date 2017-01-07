// @flow

export type Gapi = {
    auth: {
        authorize: (options: mixed, callback: Function) => void
    },
    client: {
        load: (libName: string, libVersion: string, callback: () => void) => void
    }
}