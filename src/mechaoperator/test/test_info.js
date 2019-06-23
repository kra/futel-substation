var assert = require('assert');
var sinon = require('sinon');
var info_mod = require('../info');

var getInfo = function() {
    var info = new info_mod.Info('test/assets/metrics.db');    
    return info;
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
                assert.deepEqual(
                    info.peerStatus(),
                    [ 'Peer statuses:',
                      "655(taylor st) null December 31, 1969 4:00 PM",
                      "610(crossclinton) null December 31, 1969 4:00 PM",
                      "620(souwester) null December 31, 1969 4:00 PM",
                      "625(upright) null December 31, 1969 4:00 PM",
                      '630(ypsi) null December 31, 1969 4:00 PM',
                      '640(killingsworth st) null December 31, 1969 4:00 PM',
                      "645(paz) null December 31, 1969 4:00 PM",
                      "615(robotron) null December 31, 1969 4:00 PM",
                      '667(oskar indoors) null December 31, 1969 4:00 PM',
                      '668(oskar curbside) null December 31, 1969 4:00 PM',
                      '670(r2d2) null December 31, 1969 4:00 PM',
                      '680(xnor) null December 31, 1969 4:00 PM',
                      "690(detroit bus co) null December 31, 1969 4:00 PM",
                      '695(hoyt) null December 31, 1969 4:00 PM']);
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
                // ignored
                this.clock.tick(1000 * 60 * 2);                    
                info.peerStatusAction('SIP/640', 'Registered');
                assert.deepEqual(
                    info.peerStatus(),
                    ['Peer statuses:',
                     '640(killingsworth st) Registered December 31, 1969 4:08 PM',
                     '670(r2d2) Registered December 31, 1969 4:06 PM',
                     '655(taylor st) null December 31, 1969 4:00 PM',
                     "625(upright) null December 31, 1969 4:00 PM",
                     '630(ypsi) null December 31, 1969 4:00 PM',
                     '610(crossclinton) null December 31, 1969 4:00 PM',
                     "645(paz) null December 31, 1969 4:00 PM",
                     '615(robotron) null December 31, 1969 4:00 PM',
                     '667(oskar indoors) null December 31, 1969 4:00 PM',
                     '668(oskar curbside) Registered December 31, 1969 4:00 PM',
                     '620(souwester) null December 31, 1969 4:00 PM',
                     '680(xnor) null December 31, 1969 4:00 PM',
                     "690(detroit bus co) null December 31, 1969 4:00 PM",
                     '695(hoyt) null December 31, 1969 4:00 PM']);
            });
        });
    });
    describe('recentBad', function() {
        it('should match whatever was populated in the metrics db', function(done) {
            info.recentBad(
                function(result) {
                    assert.equal(
                        JSON.stringify(result),
                        JSON.stringify(
                            [ 'recent bad events',
                              'voipms November 16, 2016 3:18 PM incoming-dialstatus-CONGESTION',
                              'voipms November 15, 2016 3:19 PM incoming-dialstatus-CONGESTION',
                              'voipms November 15, 2016 2:02 AM incoming-dialstatus-CONGESTION',
                              'voipms November 15, 2016 1:51 AM incoming-dialstatus-CONGESTION',
                              'callcentric-r2d2 November 15, 2016 1:30 AM outgoing-dialstatus-CHANUNAVAIL']));
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
                        assert.deepEqual(
                            result,
                            [ 'latest channel events',
                              '655(taylor st) November 16, 2016 9:41 PM 911-9',
                              '668(oskar curbside) November 16, 2016 5:10 PM macro-dial',
                              '670(r2d2) November 16, 2016 1:52 PM outgoing-dialtone-wrapper',
                              '680(xnor) November 16, 2016 10:35 AM outgoing-ivr',
                              '667(oskar indoors) November 15, 2016 11:34 PM outgoing-ivr',
                              '690(detroit bus co) November 14, 2016 4:20 PM wildcard-line'
                            ]);
                        done();
                    });
            });
        });
        describe('given extension', function() {
            it('should match whatever was populated in the metrics db for given extensions', function(done) {
                info.latest(
                    '668',
                    function(result) {
                        assert.equal(
                            JSON.stringify(result),
                            JSON.stringify(
                                [ 'latest channel events',
                                  '668(oskar curbside) November 16, 2016 5:10 PM macro-dial' ]));
                        done();
                    });
            });
        });
    });
});
