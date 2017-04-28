var assert = require('assert');
var sinon = require('sinon');
var info_mod = require('../info');

var getInfo = function() {
    var info = new info_mod.Info('test/assets/metrics.db');    
    return info;
}

var arrayCmp = function(left, right) {
    console.log(left);
    return left.length == right.length && left.every(function(v, i) { return v === right[i] });
}


describe('main', function() {
    var info = null;

    beforeEach(function() {
        this.clock = sinon.useFakeTimers();        
        info = getInfo();
    });
    afterEach(function() {
        this.clock.restore();
    });

    describe('peerStatus', function() {
        describe('empty', function() {            
            it('should provide an empty peer status', function() {
                assert.ok(arrayCmp(info.peerStatus(), ['Peer statuses:']));
            });
        });
        describe('populated', function() {
            it('should provide a populated peer status', function() {
                info.peerStatusAction('SIP/668', 'Registered');
                this.clock.tick(1000 * 60 * 2);                    
                info.peerStatusAction('SIP/669', 'Registered');
                this.clock.tick(1000 * 60 * 2);                    
                info.peerStatusAction('SIP/669', 'Unreachable');
                this.clock.tick(1000 * 60 * 2);                    
                info.peerStatusAction('SIP/670', 'Registered');
                assert.ok(arrayCmp(
                    info.peerStatus(),
                    ['Peer statuses:',
                     'SIP/670 Registered December 31, 1969 4:06 PM',                        
                     'SIP/669 Unreachable December 31, 1969 4:04 PM',
                     'SIP/668 Registered December 31, 1969 4:00 PM'
                    ]));
            });
        });
    });
    describe('recentBad', function() {
        it('should match whatever was populated in the metrics db', function(done) {
            info.recentBad(
                function(result) {
                    assert.ok(
                        arrayCmp(
                            result,
                            [ 'recent bad events',
                              '668 November 16, 2016 10:15 AM outgoing-dialstatus-CONGESTION',
                              '667 November 13, 2016 9:36 PM outgoing-dialstatus-CONGESTION',
                              '667 November 13, 2016 9:30 PM outgoing-dialstatus-CONGESTION',
                              '667 November 13, 2016 9:29 PM outgoing-dialstatus-CONGESTION',
                              '667 November 13, 2016 9:18 PM outgoing-dialstatus-CONGESTION' ]));
                    done();
                });
        });
    });
    describe('latest', function() {
        describe('all extensions', function() {
            it('should match whatever was populated in the metrics db for all extensions', function(done) {
                info.latest(
                    null,
                    function(result) {
                        assert.ok(
                            arrayCmp(
                                result,
                                [ 'latest channel events',
                                  '655 November 16, 2016 9:41 PM 911-9',
                                  '668 November 16, 2016 5:10 PM macro-dial',
                                  '670 November 16, 2016 1:52 PM outgoing-dialtone-wrapper',
                                  '680 November 16, 2016 10:35 AM outgoing-ivr',
                                  '667 November 15, 2016 11:34 PM outgoing-ivr' ]));
                        done();
                    });
            });
        });
        describe('given extension', function() {
            it('should match whatever was populated in the metrics db for given extensions', function(done) {
                info.latest(
                    '668',
                    function(result) {
                        assert.ok(
                            arrayCmp(
                                result,
                                [ 'latest channel events',
                                  '668 November 16, 2016 5:10 PM macro-dial' ]));
                        done();
                    });
            });
        });
    });
});
