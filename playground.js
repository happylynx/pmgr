async function f() {
    return 1;
}

async function g() {
    return Promise.resolve(2)
}
async function h() {
    return Promise.resolve(Promise.resolve(3))
}

console.log(f());
console.log(g());
console.log(h());
