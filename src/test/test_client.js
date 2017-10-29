var util = require('./util');
var assert = require('assert');
var sinon = require('sinon');
var info_mod = require('../info');
var client_mod = require('../client');

var fifthSecond = 500;

var getClient = function() {
    var info = new info_mod.Info('dbFileName');    
    var client = new client_mod.Client(info, ['noisyChannel'], 'password');
    client.start('server', 'mechaoperator', {});
    // we don't mock the server, which supplies the nick
    client.nick = 'mechaoperator';
    // patch for testing
    client.say = sinon.spy();
    return client;
}

var testOneSay = function(client, to, message, clock) {
    clock.tick(fifthSecond);
    assert(client.say.calledOnce, 'say not called once');
    assert.equal(client.say.args[0][0], to);
    var sayMessage = client.say.args[0][1];
    if (message instanceof RegExp) {
        assert(sayMessage.match(message));
    } else {
        assert.equal(sayMessage, message);
    }
}

var testSays = function(client, to, messages, clock) {
    clock.tick(fifthSecond * messages.length);
    // every message should be to to
    client.say.args.forEach(function(arg) {
        assert.equal(arg[0], to);
    });
    assert.ok(
        util.arrayCmp(
            client.say.args.map(function(l) { return l[1] }),
            messages),
        [JSON.stringify(client.say.args.map(function(l) { return l[1] })), JSON.stringify(messages)]);
}

describe('main', function() {
    var client = null;

    beforeEach(function() {
        var date = new Date(0);
        this.clock = sinon.useFakeTimers(date);
        client = getClient();
    });
    afterEach(function() {
        this.clock.restore();
    });

    describe('pm', function() {
        describe('unknown', function(done) {
            it('should pm help summary from unknown input', function() {
                client.pm('from', 'xyzzy', 'message');
                testOneSay(client, 'from', 'Use "help" for help.', this.clock);
            });
        });
        describe('hi', function() {
            it('should pm hi response', function() {
                client.pm('from', 'hi', 'message');
                testOneSay(client, 'from', 'Hi from!', this.clock);
            });
        });
        describe('die', function() {
            it('should die with correct password', function() {
                assert.throws(
                    function() {
                        client.pm('from', 'die password', 'message'); },
                    Error);
            });
        });
        describe('die', function() {
            it('should not die with incorrect password', function() {
                client.pm('from', 'die xyzzy', 'message');
            });
        });
        describe('die', function() {
            it('should not die without password', function() {
                client.pm('from', 'die', 'message');
            });
        });
        describe('help', function() {
            it('should pm help response', function() {
                client.pm('from', 'help', 'message');
                testSays(client, 'from', [
                    'available commands:',
                    'hi say hello',
                    'help get command help',
                    'latest [days] [extension] get latest events',
                    'stats [days] [extension] get event stats',
                    'recentbad get recent events',
                    'peerstatus get recent peer status',
                    'peerstatusbad get recent bad peer status'], this.clock)
            });
        });
    });

    describe('bang commands in channel', function() {
        describe('unknown', function() {
            it('should not respond to unknown command', function() {
                client.channelMessage('from', 'to', '!xyzzy', 'message');
                assert.equal(false, client.say.called);
            });
        });
        describe('hi', function() {
            it('should say hi response', function() {
                client.channelMessage('from', 'to', '!hi', 'message');
                testOneSay(client, 'to', 'Hi from!', this.clock);                
            });
        });
        describe('help', function() {
            it('should not respond to help command', function() {
                client.channelMessage('from', 'to', '!help', 'message');
                assert.equal(false, client.say.called);
            });
        });
        describe('peerStatus', function() {
            describe('empty', function() {            
                it('should provide an empty peer status', function() {
                    client.channelMessage('from', 'to', '!peerstatus', 'message');
                    testSays(client,
                             'to',
                             ["Peer statuses:",
                              "SIP/630 null December 31, 1969 4:00 PM",
                              "SIP/640 null December 31, 1969 4:00 PM",
                              "SIP/655 null December 31, 1969 4:00 PM",
                              "SIP/667 null December 31, 1969 4:00 PM",
                              "SIP/668 null December 31, 1969 4:00 PM",
                              "SIP/669 null December 31, 1969 4:00 PM",
                              "SIP/670 null December 31, 1969 4:00 PM",
                              "SIP/680 null December 31, 1969 4:00 PM"],
                             this.clock);
                });
            });
        });
        describe('peerStatusBad', function() {
            describe('empty', function() {            
                it('should provide an empty peer status', function() {
                    client.channelMessage('from', 'to', '!peerstatusbad', 'message');
                    testSays(client,
                             'to',
                             ["Peer statuses:",
                              "SIP/630 null December 31, 1969 4:00 PM",
                              "SIP/640 null December 31, 1969 4:00 PM",
                              "SIP/655 null December 31, 1969 4:00 PM",
                              "SIP/667 null December 31, 1969 4:00 PM",
                              "SIP/668 null December 31, 1969 4:00 PM",
                              "SIP/669 null December 31, 1969 4:00 PM",
                              "SIP/670 null December 31, 1969 4:00 PM",
                              "SIP/680 null December 31, 1969 4:00 PM"],
                             this.clock);
                });
            });
            describe('populated', function() {
                it('should provide a populated peer status', function() {
                    client.peerStatusAction('SIP/668', 'Unreachable');
                    this.clock.tick(1000 * 60 * 2);
                    client.peerStatusAction('SIP/668', 'Registered');
                    this.clock.tick(1000 * 60 * 2);
                    client.peerStatusAction('SIP/669', 'Registered');
                    this.clock.tick(1000 * 60 * 2);
                    client.peerStatusAction('SIP/669', 'Unreachable');
                    this.clock.tick(1000 * 60 * 2);
                    client.peerStatusAction('SIP/670', 'Unreachable');
                    client.channelMessage('from', 'to', '!peerstatusbad', 'message');
                testSays(client,
                         'to',
                         ["Peer statuses:",
                          "SIP/670 Unreachable December 31, 1969 4:08 PM",
                          "SIP/669 Unreachable December 31, 1969 4:06 PM",
                          "SIP/630 null December 31, 1969 4:00 PM",
                          "SIP/640 null December 31, 1969 4:00 PM",
                          "SIP/655 null December 31, 1969 4:00 PM",
                          "SIP/667 null December 31, 1969 4:00 PM",
                          "SIP/680 null December 31, 1969 4:00 PM"],
                         this.clock);
                });
            });
        });            
    });
    describe('nick hails in channel', function() {
        describe('unknown', function() {
            it('should not respond to unknown hail', function() {
                client.channelMessage('from', 'to', 'mechaoperator: xyzzy', 'message');
                assert.equal(false, client.say.called);
            });
        });
        describe('hi', function() {
            it('should say hi response', function() {
                client.channelMessage('from', 'to', 'mechaoperator: hi', 'message');
                testOneSay(client, 'to', 'Hi from!', this.clock);                
            });
        });
        describe('help', function() {
            it('should not respond to help command', function() {
                client.channelMessage('from', 'to', 'mechaoperator: help', 'message');
                assert.equal(false, client.say.called);
            });
        });
    });

    describe('talk in channel', function() {
        describe('unknown', function() {
            it('should not respond in non-noisy channel', function() {
                client.channelMessage(
                    'from', 'to', 'mechaoperator is foo', {args: []});
                assert.equal(false, client.say.called);
            });
        });
        describe('unknown', function() {
            it('should not respond to unknown talk', function() {
                client.channelMessage(
                    'from', 'to', 'xyzzy', {args: ['noisyChannel']});
                assert.equal(false, client.say.called);
            });
        });
        describe('unknown', function() {
            it('should not respond to command without hail or bang',
               function() {
                   client.channelMessage(
                       'from', 'to', 'hi', {args: ['noisyChannel']});
                   assert.equal(false, client.say.called);
               });
        });
        describe('mechaoperator is', function() {
            it('should respond to mechaoperator is', function() {
                client.channelMessage(
                    'from', 'to', 'mechaoperator is foo', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're foo!", this.clock);
            });
            it('should respond to mechy is', function() {
                client.channelMessage(
                    'from', 'to', 'mechy is foo', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're foo!", this.clock);
            });
        });
        describe('mechaoperator is', function() {
            it('should respond to mechaoperator is with surrounding text', function() {
                client.channelMessage(
                    'from', 'to', 'foo mechaoperator is bar...', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're bar!", this.clock);
            });
            it('should respond to mechy is with surrounding text', function() {
                client.channelMessage(
                    'from', 'to', 'foo mechy is bar...', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're bar!", this.clock);
            });
        });
        describe('mechaoperator is', function() {
            it('should respond to mechaoperator is with capitalization', function() {
                client.channelMessage(
                    'from', 'to', 'Mechaoperator is bar', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're bar!", this.clock);
            });
            it('should respond to mechaoperator is with capitalization', function() {
                client.channelMessage(
                    'from', 'to', 'MECHAOPERATOR IS BAR', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're bar!", this.clock);
            });
            it('should respond to mechy is with capitalization', function() {
                client.channelMessage(
                    'from', 'to', 'MECHY IS BAR', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're bar!", this.clock);
            });
        });
        describe('plate', function() {
            it('should respond to plate', function() {
                client.channelMessage(
                    'from', 'to', 'foo plate bar', {args: ['noisyChannel']});
                testOneSay(client, 'to', "Suddenly someone'll say, like, plate, or shrimp, or plate o' shrimp out of the blue, no explanation.", this.clock);
            });
        });
        describe('plate', function() {
            it('should respond to plate with capitalization', function() {
                client.channelMessage(
                    'from', 'to', 'Foo Plate Bar', {args: ['noisyChannel']});
                testOneSay(client, 'to', "Suddenly someone'll say, like, plate, or shrimp, or plate o' shrimp out of the blue, no explanation.", this.clock);
            });
        });
        describe('plate', function() {
            it('should respond to plate with capitalization', function() {
                client.channelMessage(
                    'from', 'to', 'Foo PLATE Bar', {args: ['noisyChannel']});
                testOneSay(client, 'to', "Suddenly someone'll say, like, plate, or shrimp, or plate o' shrimp out of the blue, no explanation.", this.clock);
            });
        });
        describe('yes', function() {
            it('should respond to yes', function() {
                client.channelMessage(
                    'from', 'to', 'yes', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No.", this.clock);
            });
        });
        describe('yes', function() {
            it('should respond to yes with punctuation', function() {
                client.channelMessage(
                    'from', 'to', ' yes??', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No.", this.clock);
            });
        });
        describe('yes', function() {
            it('should respond to yes with capitalization', function() {
                client.channelMessage(
                    'from', 'to', 'YES', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No.", this.clock);
            });
        });
        describe('error', function() {
            it('should respond to error', function() {
                client.channelMessage(
                    'from', 'to', 'error', {args: ['noisyChannel']});
                // just test that we get something
                testOneSay(client, 'to', /.*/, this.clock);
            });
        });
        describe('morning', function() {
            it('should respond to a morning greeting if it is morning', function() {
                this.clock.setSystemTime(new Date(2016, 1, 1, 1));
                client.channelMessage(
                    'from', 'to', 'foo morning bar', {args: ['noisyChannel']});
                // just test that we get something
                testOneSay(client, 'to', /.*/, this.clock);
            });
        });
        describe('morning', function() {
            it('should not respond to a morning greeting if it is not morning', function() {
                this.clock.setSystemTime(new Date(2016, 1, 1, 23));                
                client.channelMessage(
                    'from', 'to', 'foo morning bar', {args: ['noisyChannel']});
                assert.equal(false, client.say.called);
            });
        });
        describe('rate limiting', function() {
            it('should not respond again before timeout', function() {
                // talk to channel
                client.channelMessage(
                    'from', 'to', 'mechaoperator is foo', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're foo!", this.clock);

                // advance one second
                this.clock.tick(1000);
                // talk to channel                
                client.channelMessage(
                    'from', 'to', 'mechaoperator is bar', {args: ['noisyChannel']});
                // still one say
                testOneSay(client, 'to', "No, from, you're foo!", this.clock);

                // advance one second
                this.clock.tick(1000);
                // talk to channel                
                client.channelMessage(
                    'from', 'to', 'mechaoperator is baz', {args: ['noisyChannel']});
                // still one say
                testOneSay(client, 'to', "No, from, you're foo!", this.clock);

                // advance 6 minutes
                this.clock.tick(1000 * 60 * 6);
                // talk to channel
                client.channelMessage(
                    'from', 'to', 'mechaoperator is qux', {args: ['noisyChannel']});
                // two says                
                testSays(client, 'to', ["No, from, you're foo!", "No, from, you're qux!"], this.clock);

                // advance one second
                this.clock.tick(1000);
                // talk to channel
                client.channelMessage(
                    'from', 'to', 'mechaoperator is quux', {args: ['noisyChannel']});
                // still two says                
                testSays(client, 'to', ["No, from, you're foo!", "No, from, you're qux!"], this.clock);
                // talk to channel for other responses
                client.channelMessage(
                    'from', 'to', 'foo plate bar', {args: ['noisyChannel']});
                client.channelMessage(
                    'from', 'to', 'yes', {args: ['noisyChannel']});
                // still two says                
                testSays(client, 'to', ["No, from, you're foo!", "No, from, you're qux!"], this.clock);
            });
            it('should not repeat responses', function() {
                // talk to channel to get first response
                client.channelMessage(
                    'from', 'to', 'mechaoperator is foo', {args: ['noisyChannel']});
                testOneSay(client, 'to', "No, from, you're foo!", this.clock);

                // advance 6 minutes
                this.clock.tick(1000 * 60 * 6);
                // talk to channel to get first response
                client.channelMessage(
                    'from', 'to', 'mechaoperator is foo', {args: ['noisyChannel']});
                // still one say
                testOneSay(client, 'to', "No, from, you're foo!", this.clock);

                // advance 6 minutes
                this.clock.tick(1000 * 60 * 6);
                // talk to channel to get second response                
                client.channelMessage(
                    'from', 'to', 'foo plate bar', {args: ['noisyChannel']});
                // two says
                testSays(
                    client,
                    'to',
                    ["No, from, you're foo!",
                     "Suddenly someone'll say, like, plate, or shrimp, or plate o' shrimp out of the blue, no explanation."],
                    this.clock);

                // advance 6 minutes
                this.clock.tick(1000 * 60 * 6);
                // talk to channel to get second response                
                client.channelMessage(
                    'from', 'to', 'foo plate bar', {args: ['noisyChannel']});
                // still two says
                testSays(
                    client,
                    'to',
                    ["No, from, you're foo!",
                     "Suddenly someone'll say, like, plate, or shrimp, or plate o' shrimp out of the blue, no explanation."],
                    this.clock);

                // advance 6 minutes
                this.clock.tick(1000 * 60 * 6);
                // talk to channel to get first response
                client.channelMessage(
                    'from', 'to', 'mechaoperator is foo', {args: ['noisyChannel']});
                // three says
                testSays(
                    client,
                    'to',
                    ["No, from, you're foo!",
                     "Suddenly someone'll say, like, plate, or shrimp, or plate o' shrimp out of the blue, no explanation.",
                    "No, from, you're foo!"],
                    this.clock);
            });
        });
        it('should rate limit', function() {
            client.pm('from', 'xyzzy', 'message');
            client.channelMessage('from', 'to', '!hi', 'message');
            client.pm('from', 'hi', 'message');
            client.channelMessage(
                'from', 'to', 'mechaoperator is foo', {args: ['noisyChannel']});
            assert.equal(false, client.say.called);            
            this.clock.tick(1);
            assert.equal(false, client.say.called);
            this.clock.tick(fifthSecond - 1);
            assert.equal(client.say.args[0][0], 'from');
            assert.equal(client.say.args[0][1], 'Use "help" for help.');
            this.clock.tick(fifthSecond);
            assert.equal(client.say.args[1][0], 'to');
            assert.equal(client.say.args[1][1], 'Hi from!');
            this.clock.tick(fifthSecond * 2);
            assert.equal(client.say.args[2][0], 'from');
            assert.equal(client.say.args[2][1], 'Hi from!');
            assert.equal(client.say.args[3][0], 'to');
            assert.equal(client.say.args[3][1], "No, from, you're foo!");
        });
    });
    describe('multiple channel and pm messages', function() {
        it('should handle multiple destinations', function() {
            client.pm('from', 'xyzzy', 'message');
            client.channelMessage('from', 'to', '!hi', 'message');
            client.pm('from', 'hi', 'message');
            client.channelMessage(
                'from', 'to', 'mechaoperator is foo', {args: ['noisyChannel']});
            sayArgs = [['from', 'Use "help" for help.'],
                       ['to', 'Hi from!'],
                       ['from', 'Hi from!'],
                       ['to', "No, from, you're foo!"]]
            this.clock.tick(fifthSecond * 4);
            while (sayArgs.length) {
                var expected = sayArgs.pop();
                var actual = client.say.args.pop();
                assert.equal(expected[0], actual[0]);
                assert.equal(expected[1], actual[1]);
            }
            assert.equal(client.say.args.length, 0);
        });
    });
});

