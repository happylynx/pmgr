// @flow

// const a = {foo:8, bar: 9}
declare interface A {
    foo: number
}
declare var a: A

console.log(a.foo)
