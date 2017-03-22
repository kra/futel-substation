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
                info.peerStatusAction('SIP/703', 'Registered');
                this.clock.tick(1000 * 60 * 2);                    
                info.peerStatusAction('SIP/703', 'Unreachable');
                this.clock.tick(1000 * 60 * 2);                    
                info.peerStatusAction('SIP/704', 'Registered');
                assert.ok(arrayCmp(
                    info.peerStatus(),
                    ['Peer statuses:',
                     'SIP/704 Registered December 31, 1969 4:06 PM',                        
                     'SIP/703 Unreachable December 31, 1969 4:04 PM',
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
        it('should match whatever was populated in the metrics db', function(done) {
            info.latest(
                null,
                function(result) {
                    assert.ok(
                        arrayCmp(
                            result,
                            [ 'latest channel events',
                              '655 November 16, 2016 9:41 PM 911-9',
                              '66.193.176.35 November 16, 2016 7:03 PM ring-r2d2',
                              '668 November 16, 2016 5:10 PM macro-dial',
                              'voipms November 16, 2016 3:18 PM incoming-dialstatus-CONGESTION',
                              '670 November 16, 2016 1:52 PM outgoing-dialtone-wrapper',
                              '680 November 16, 2016 10:35 AM outgoing-ivr',
                              '702 November 15, 2016 11:49 PM wildcard-line-play',
                              '667 November 15, 2016 11:34 PM outgoing-ivr',
                              'callcentric November 15, 2016 10:06 AM ring-r2d2',
                              'callcentric-r2d2 November 15, 2016 1:30 AM outgoing-dialstatus-CHANUNAVAIL',
                              '690 November 14, 2016 4:20 PM wildcard-line',
                              '681 November 13, 2016 12:34 PM outgoing-ivr',
                              '656 October 30, 2016 5:48 PM outgoing-ivr',
                              '691 October 14, 2016 6:12 PM outgoing-ivr',
                              '650 October 10, 2016 5:42 PM outgoing-ivr',
                              '704 October 9, 2016 12:04 AM outgoing-ivr' ]));
                    done();
                });
        });
    });
});
