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
                assert.equal(
                    JSON.stringify(info.peerStatus()),
                    JSON.stringify(
                        [ 'Peer statuses:',
                          "610(crossclinton) null January 1, 1970 12:00 AM",                   
                          '630(ypsi) null January 1, 1970 12:00 AM',
                          '640(killingsworth st) null January 1, 1970 12:00 AM',
                          "645(paz) null January 1, 1970 12:00 AM",                          
                          '655(taylor st) null January 1, 1970 12:00 AM',
                          '667(oskar indoors) null January 1, 1970 12:00 AM',
                          '668(oskar curbside) null January 1, 1970 12:00 AM',
                          '669(oskar office) null January 1, 1970 12:00 AM',
                          '670(r2d2) null January 1, 1970 12:00 AM',
                          '680(xnor) null January 1, 1970 12:00 AM' ]));
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

                assert.equal(
                    JSON.stringify(info.peerStatus()),
                    JSON.stringify(
                        ['Peer statuses:',
                         '640(killingsworth st) Registered January 1, 1970 12:08 AM',
                         '670(r2d2) Registered January 1, 1970 12:06 AM',
                         '669(oskar office) Unreachable January 1, 1970 12:04 AM',
                         '610(crossclinton) null January 1, 1970 12:00 AM',
                         '630(ypsi) null January 1, 1970 12:00 AM',
                          "645(paz) null January 1, 1970 12:00 AM",
                         '655(taylor st) null January 1, 1970 12:00 AM',
                         '667(oskar indoors) null January 1, 1970 12:00 AM',
                         '668(oskar curbside) Registered January 1, 1970 12:00 AM',
                         '680(xnor) null January 1, 1970 12:00 AM']));
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
                        assert.equal(
                            JSON.stringify(result),
                            JSON.stringify(
                                [ 'latest channel events',
                                  '655(taylor st) November 16, 2016 9:41 PM 911-9',
                                  '668(oskar curbside) November 16, 2016 5:10 PM macro-dial',
                                  '670(r2d2) November 16, 2016 1:52 PM outgoing-dialtone-wrapper',
                                  '680(xnor) November 16, 2016 10:35 AM outgoing-ivr',
                                  '667(oskar indoors) November 15, 2016 11:34 PM outgoing-ivr' ]));
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
