var assert = require('assert');

describe('a suite of tests', function() {
    it('should take less than 500ms', function(done){
        this.timeout(500);
        setTimeout(done, 300);
    });    
    it('should take less than 500ms also', function(done){
        this.timeout(2000);
        setTimeout(function() {
            //assert.equal(false, true);
            done();
        }, 1000);
    });    
})
