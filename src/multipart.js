// @flow

export default function multipart(properties: Object, data: string, dateType: string): {body: string, separator: string} {
    const separator = createSeparator()
    let result = `--${separator}\nContent-Type: application/json; charset=UTF-8\n\n${JSON.stringify(properties)}\n\n`
    result += `--${separator}\nContent-Type: ${dateType}; charset=UTF-8\n\n${data}\n`;
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