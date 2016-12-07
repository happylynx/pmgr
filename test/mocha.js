'use strict';

describe('test 1', () => {
    it('should pass', () => {
        expect(true).to.be.ok()
    })
    it('should not pass', () => {
        expect(false).to.equal(true)
    })
})