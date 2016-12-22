'use strict';

describe('complete en/decrypt', () => {
    it('should match', (done) => {
        const password = 'a'
        const plaintext = 'hello world'
        completeEncrypt(password, plaintext)
            .then(cryptotext => completeDecrypt(password, cryptotext))
            .then(decrypted => {
                expect(decrypted).to.equal(plaintext)
                done()
            })
            .catch(done)
    })
    it('empty string', (done) => {
        const password = 'a'
        const plaintext = ''
        completeEncrypt(password, plaintext)
            .then(cryptotext => completeDecrypt(password, cryptotext))
            .then(decrypted => {
                expect(decrypted).to.equal(plaintext)
                done()
            })
            .catch(done)
    })
    it('long string', (done) => {
        const password = 'a'
        const plaintext = `
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis dignissim congue varius. Curabitur porta pharetra ultrices. Nullam porta libero a mattis dapibus. Morbi in sagittis dui. Aliquam a augue id neque finibus rutrum. Sed lacinia rhoncus sapien vel scelerisque. Donec ut mauris hendrerit, volutpat lectus et, convallis metus. Aliquam a sagittis turpis. Nam odio massa, auctor id efficitur eu, laoreet non quam. Vivamus nulla massa, pellentesque id dictum quis, vehicula eu risus. Vivamus hendrerit scelerisque leo, non lacinia tellus ultrices et. Cras vulputate sapien auctor ultricies aliquet. Nulla sed euismod neque. Nulla facilisi.

            Duis iaculis, nibh non semper vehicula, nunc magna condimentum est, eu viverra tortor ex id neque. Sed egestas eu ex sollicitudin pharetra. Etiam tempus congue nisi sed efficitur. Nunc auctor lacus velit, ac bibendum elit varius eget. Fusce odio eros, fermentum eget accumsan id, mollis sagittis lacus. Nunc eu tempus libero. Proin gravida purus mauris, a scelerisque neque mattis in. Etiam egestas, massa non varius finibus, magna mi sodales nulla, semper lobortis libero magna eu quam.

            Vivamus sagittis, lectus et tempus aliquet, tellus elit tristique nibh, eget fringilla dolor enim a urna. Suspendisse vitae nulla sed eros ullamcorper volutpat a non mi. Duis sed semper elit, faucibus malesuada lorem. Duis ut efficitur massa. Maecenas fringilla, tortor eget eleifend interdum, enim ex accumsan ante, in convallis dolor ipsum nec nisl. Sed posuere dapibus felis quis finibus. Praesent sed condimentum arcu, vitae venenatis est. Maecenas blandit sapien sed consequat ornare. Pellentesque rutrum ultrices purus ac dictum. Pellentesque sed aliquam purus. Morbi tempor nunc a semper interdum. Curabitur nec felis dignissim, condimentum turpis id, dapibus leo. Curabitur malesuada nisl quis fermentum consequat. Sed dignissim luctus magna sed luctus. Aenean quis molestie justo.

            Donec in facilisis odio. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In quis risus nisl. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam lorem nulla, gravida in lacus quis, malesuada semper est. Duis mattis augue sit amet commodo ultricies. Etiam in elit in magna rutrum elementum. Morbi vel justo tortor. Vestibulum bibendum sit amet odio quis semper. Curabitur in sem ac odio molestie placerat. Aenean feugiat fermentum euismod. Nam id quam vel urna feugiat dignissim. Donec at sagittis arcu. Vestibulum nec hendrerit erat, nec hendrerit lorem. Curabitur lacinia tristique turpis, a feugiat quam fermentum a.

            Nam eu ultrices ligula. Morbi quis tincidunt magna. Curabitur eu arcu quis lacus consequat tristique. Integer quis diam enim. Nam et sollicitudin eros. Fusce a eros dolor. Phasellus nec consequat ex. Sed arcu ex, euismod vitae tincidunt sed, feugiat et velit. Nam ut nibh eget est gravida tempus. Aliquam sit amet dui aliquet, varius magna sed, tempus elit. Nunc porta metus quis sem facilisis accumsan. Etiam eget molestie odio, posuere mattis lacus. Pellentesque nibh magna, posuere a consequat vel, dapibus id arcu. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.

            Curabitur mollis tempus turpis. Proin vulputate elit massa, rutrum fermentum risus mollis quis. Donec eget accumsan erat. Nunc ut mattis lectus. Donec commodo leo a porttitor dictum. Quisque eu sollicitudin tortor. Mauris convallis ante velit, sed ultrices nisi varius et. Sed sollicitudin id metus eu fringilla. Sed bibendum nibh nunc, a rhoncus augue rhoncus et. Suspendisse potenti. Nulla risus nisi, pretium egestas sem sed, cursus molestie tortor. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed tellus lectus, mattis id leo ac, aliquam euismod sem.

            Morbi sit amet nunc eu nisi eleifend luctus. Aenean tempor commodo dui, sed interdum felis aliquam sed. In fermentum efficitur varius. Maecenas fermentum in mauris sed sagittis. Donec mattis lectus felis, a efficitur arcu varius ut. Fusce egestas erat vel odio porttitor commodo. Ut in lacinia lectus. Sed ut congue mi. Curabitur eget convallis massa, non tristique neque.

            Nam id diam ornare, commodo diam eleifend, fringilla ligula. Nullam viverra nunc ante, eu semper enim dignissim quis. Nulla eget mollis erat, et pulvinar diam. Phasellus at nisl ut dui vulputate dictum. Praesent fringilla, orci quis dictum gravida, quam magna gravida felis, vitae dictum dui ante quis felis. Cras sit amet velit sagittis, mollis ipsum ut, aliquet dui. Nulla a iaculis enim. Nulla velit justo, efficitur ac augue sed, vestibulum pulvinar dolor. Donec pulvinar orci eu viverra tincidunt. Curabitur vitae dignissim odio. Praesent sollicitudin odio in ipsum semper, eu dignissim neque fermentum.

            Duis iaculis iaculis pulvinar. Nulla tincidunt tortor at justo fringilla, non sodales ex hendrerit. Nulla rhoncus feugiat eros, id pellentesque nibh fringilla non. In semper nulla nibh, consequat bibendum lorem tristique quis. Ut eget aliquet urna. Duis venenatis vitae lectus at dictum. Quisque facilisis enim quis dignissim hendrerit. Morbi eros ex, mollis nec sapien vitae, semper varius magna. Integer velit ligula, viverra ac ipsum auctor, ultricies tempus risus.

            Proin sapien mauris, vehicula et fermentum vel, semper et eros. Vivamus et nibh sodales, dignissim erat in, mollis tellus. Donec purus magna, iaculis scelerisque hendrerit ac, pellentesque nec nulla. Morbi nunc orci, facilisis non lobortis a, maximus in erat. Vestibulum tortor tellus, placerat non sapien at, gravida facilisis augue. Integer ut metus nec nunc placerat lacinia. Maecenas ex ipsum, bibendum in ligula molestie, dapibus rhoncus quam. `
        completeEncrypt(password, plaintext)
            .then(cryptotext => completeDecrypt(password, cryptotext))
            .then(decrypted => {
                expect(decrypted).to.equal(plaintext)
                done()
            })
            .catch(done)
    })
})

describe('completeEncrypt', () => {
    it('should finish', (done) => {
        completeEncrypt('a', 'text')
            .then(() => done())
            .catch(done)
    })
    it('should return Uint8Array', (done) => {
        completeEncrypt('a', 'text')
            .then(cryptotext => {
                expect(cryptotext).to.be.a(Uint8Array)
                done()
            })
            .catch(done)
    })
})

describe('completeDecrypt', () => {
    const cryptoText = new Uint8Array([1,0,0,0,212,24,86,166,91,151,142,76,238,17,88,101,13,177,168,216,128,87,20,82])
    it('should finish', (done) => {
        completeDecrypt('a', cryptoText)
            .then(() => done())
            .catch(done)
    })
    it('should return string', (done) => {
        completeDecrypt('a', cryptoText)
            .then(cryptotext => {
                expect(cryptotext).to.be.a('string')
                done()
            })
            .catch(done)
    })
})

describe('hashing', () => {
    it('matches', () => {
        const content = 'a'
        const verifiedContent = forTesting.verifyHash(forTesting.prependHash(content))
        expect(verifiedContent).to.equal(content)
    })

    describe('verifyHash', () => {
        it('survives short input', () =>{
            expect(forTesting.verifyHash('a')).to.be(null)
        })
    })
})

describe('randomize', () => {
    it('matches', () => {
        const content = new Uint8Array([0, 1, 2, 3, 4])
        const deRandomizeContent = forTesting.deRandomize(randomize(content))
        expect(deRandomizeContent).to.eqaul(content)
    })

    it('does something', () => {
        const content = new Uint8Array([0, 1, 2, 3, 4])
        const randomized = forTesting.randomize(content)
        expect(randomized).not.to.eql(content)
    })
})