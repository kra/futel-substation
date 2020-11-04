var irc = require('irc');
var util = require('util');

var defaultStatsDays = 60;
var contentThrottleLength = 10;
var timeThrottleMilliseconds = 1000 * 60 * 10;

var sample = function(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

var stringIn = function(str1, str2) {
    // return True if str1 is in str2
    return str2.indexOf(str1) > -1;
}

function Client(info, noisyChannels, botPassword) {
    this.info = info;
    this.noisyChannels = noisyChannels;
    this.botPassword = botPassword;
    this.says = new Map();
    this.throttleConferenceDate = null;
    this.throttleConferenceNum = 0;
    this.throttleDates = {};
    this.throttleContents = {};    
}

util.inherits(Client, irc.Client);

Client.prototype.log = function() {
    var args = [new Date()].concat(Array.from(arguments));
    console.log(args);
};

Client.prototype.addSay = function(to, text) {
    if (this.says.get(to) === undefined) {
        this.says.set(to, [text]);
    } else {
        says = this.says.get(to);
        says.push(text);
        this.says.set(to, says);
    }
};

Client.prototype.doSays = function() {
    // doSay up to once for each key in says.
    // floodProtection in client config can probably do this for us instead?
    var self = this;
    self.says.forEach(function(value, key) {
        // Shift the first say and say it, if it exists
        if (value.length) {
            text = value.shift();
            self.says.set(key, value);
            self.doSay(key, text);
        }
    });
};

Client.prototype.doSay = function(to, text) {
    //this.log('say', to, text);
    this.say(to, text);
};

Client.prototype.sayOrSay = function(from, to, text) {
    if (to === null) {
        // pm
        this.addSay(from, text);
    } else {
        // channel command
        this.addSay(to, text);
    }
};

Client.prototype.noisySay = function(text) {
    var self = this;
    this.noisyChannels.forEach(function(channel) {
        self.addSay(channel, text);
    });
};

Client.prototype.peerStatusAction = function(peer, status) {
    // Tell info to update status for peer.
    // To be called for incoming peer status message.
    this.info.peerStatusAction(peer, status);
};

Client.prototype.peerStatus = function(self, from, to, text, message) {
    self.info.peerStatus().forEach(function(line) {self.sayOrSay(from, to, line);});
};

Client.prototype.peerStatusBad = function(self, from, to, text, message) {
    self.info.peerStatusBad().forEach(function(line) {self.sayOrSay(from, to, line);});    
};

Client.prototype.confbridgeJoinAction = function(num_channels) {
    if (num_channels > 1) {
        this.noisySay(`Voice conference population ${num_channels} - 503 HOT 1337`);
    }
};

//Client.prototype.confbridgeLeaveAction = function() {
//    this.noisySay('Voice conference left');
//};

Client.prototype.hi = function(self, from, to, text, message) {
    self.sayOrSay(from, to, 'Hi ' + from + '!');    
};

Client.prototype.help = function(self, from, to, text, message) {
    var help = ['available commands:',
                'hi say hello',
                'help get command help',
                'latest [days] [extension] get latest events',
                'stats [days] [extension] get event stats',
                'recentbad get recent events',
                'peerstatus get recent peer status',
                'peerstatusbad get recent bad peer status'
               ];
    // should probably only PM back
    for (var line in help) {
        self.sayOrSay(from, to, help[line]);
    }
};

Client.prototype.textToCommands = function(text) {
    return text.trim().split(/\s+/);
};

Client.prototype.textToArgs = function(self, text) {
    var args = self.textToCommands(text);
    var days = args[1];
    var extension = args[2];
    try {
        days = days.toString();
    } catch(e) {
        days = defaultStatsDays;
    }
    try {
        extension = extension.toString();
    } catch(e) {
        extension = null;
    }
    return [days, extension];
};

Client.prototype.passwordMatch = function(text) {
    var words = this.textToCommands(text);
    if (words[1] == this.botPassword) {
        return true;
    }
    this.log('passwordMatch failed');
    return false;
};

Client.prototype.die = function(self, from, to, text, message) {
    if (self.passwordMatch(text)) {
        self.log('dying');
        throw new Error('dying');
    }
};

Client.prototype.stats = function(self, from, to, text, message) {
    var args = self.textToArgs(self, text);
    var days = args[0];
    var extension = args[1];
    self.info.stats(
        days,
        extension,
        function(result) {
            result.map(function (line) { self.sayOrSay(from, to, line); });
        });
};
    
Client.prototype.latest = function(self, from, to, text, message) {
    var args = self.textToArgs(self, text);
    var days = args[0];         // XXX ignored
    var extension = args[1];
    self.info.latest(
        extension,
        function(result) {
            result.map(function (line) { self.sayOrSay(from, to, line); });
        });
};

Client.prototype.recentBad = function(self, from, to, text, message) {
    self.info.recentBad(
        function(result) {
            result.map(function (line) { self.sayOrSay(from, to, line); });
        });
};
   
Client.prototype.errorMessage = function(self, from, to, text, message) {
    self.sayOrSay(from, to, 'Use "help" for help.');
};

Client.prototype.simpleStrings = function(_from, text) {
    // simple string to string response
    var responses = {
        'yes': "No.",
        'yeah': "No.",        
        'no': "Yes.",
        'maybe': "MAYBE?",
        'false': "True.",
        'true': "False.",
        'hi': "Hi!",
        'hello': "Hi!",
    }
    text = text.toLowerCase();
    text = text.replace(/[^\w]/g,'');
    for (var key in responses) {
        if (key == text) {
            return responses[key];
        }
    }
    return null;
};

Client.prototype.simpleSubstrings = function(_from, text) {
    // simple substring to string response
    var responses = {
        // overused
        //"car": "You find one in every car. You'll see.",
        "code": "Not many people got a code to live by anymore.",
        "die": "The lights are growing dim.",
        "efficency": "The human race is inefficient. Therefore it must be destroyed.",
        "efficent": "The human race is inefficient. Therefore it must be destroyed.",
        "explode": "People just explode. Natural causes.",
        "frank": "And please try to be frank.",
        "guidance": "I am guided by my infallable logic.",
        "guide": "I am guided by my infallable logic.",
        "hail": "Scientists are at a loss to explain the freak showers of tiny cubes of ice.",
        "innocence": "No one is innocent.",
        "innocent": "No one is innocent.",
        "intense": "The life of a repo man is always intense.",
        // overused
        //"know": "For the sake of this and future generations you must tell us everything you know.",
        "logic": "I am guided by my infallable logic.",
        "plate": "Suddenly someone'll say, like, plate, or shrimp, or plate o' shrimp out of the blue, no explanation.",
        "project": "When they canceled the project it almost did me in.",
        "quiet": "Too quiet.",
        "radiation": "You hear the most outrageous lies about it.",
        "relationship": "What about our relationship?",
        "repo": "The life of a repo man is always intense.",        
        "shrimp": "Suddenly someone'll say, like, plate, or shrimp, or plate o' shrimp out of the blue, no explanation.",
        "situation": "A repo man spends his life getting into tense situations.",
        "society": "Society made me what I am.",
        "tense": "A repo man spends his life getting into tense situations.",
        "trunk": "You don't want to look in there.",
        "ufo": "Flying saucers. Which are really? Yeah you got it. Time machines.",
        "weather": "Scientists are at a loss to explain the freak showers of tiny cubes of ice."
    }
    for (var key in responses) {
        if (stringIn(key, text)) {
            return responses[key];
        }
    }
    return null;
};

Client.prototype.substrings = function(from, text) {
    // substring to response
    var responses = {};
    // is message greeting the morning?
    responses['morning'] = function(text) {
        if (new Date().getHours() < 12) {
            var sayings = [
                'MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING',
                'Morning.', 'Morning!',
                'Good morning.', 'Good morning!', 'GOOD MORNING',
                'Guten morgen.', 'GUTEN MORGEN',
                'QAPLA'];
            return sample(sayings);
        }
    };
    // does message call me anything?    
    responses['mechaoperator' + ' is'] = function(text) {
        text = text.replace(RegExp('[\.\!\?]+$'), '') // strip terminal punct
        var outString = text.replace(RegExp('.*' + 'mechaoperator is '), '');
        outString = "No, " + from + ", you're " + outString + '!';
        return outString;
    };
    responses['mechy' + ' is'] = function(text) {
        text = text.replace(RegExp('[\.\!\?]+$'), '') // strip terminal punct
        var outString = text.replace(RegExp('.*' + 'mechy is '), '');
        outString = "No, " + from + ", you're " + outString + '!';
        return outString;
    };
    // does message mention me?
    hello = function(text) {    
        var sayings = [
            'Yo.', 'Hi.', 'Hello.', 'Hej.', 'Qapla!',
            '?', '!', 'Yes.', 'No.', ''];
        return sample(sayings);
    };
    responses['mechaoperator'] = hello;
    responses['mechy'] = hello;    
    var sayError = function(text) {
        var sayings = [
            'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR',
            'ERROR ERROR ERROR', 'ERROR ERROR ERROR', 'ERROR ERROR ERROR', 'ERROR ERROR ERROR',
            'ERROR ERROR ERROR ERROR ERROR ERROR ERROR'];
        return sample(sayings);
    };
    responses['error'] = sayError;
    responses['fail'] = sayError;
    var sayNice = function(text) {
        var sayings = [
            'nice', 'nice!', 'niiice!', 'niiiiiice!',
            'NICE', 'NIIICE', 'NIIIIIICE'];
        return sample(sayings);
    };
    responses['nice'] = sayNice;

    for (var key in responses) {
        if (stringIn(key, text)) {
            return responses[key](text);
        }
    }
    return null;
};

Client.prototype.exps = function(from, text) {
    // expressions to response
    var text = text.replace(/\s+/g, '');
    var regexps = [
            /(ha|hah|har|haw|he|hee|heh|ho|hue){2,}/,
            /^(ha|hah|har|haw|he|hee|heh|ho)$/,
            ///(lo|lol){2,}/,
            /^lol$/
            ]
    return regexps.map(function (regexp) {
         var match = text.match(regexp);
         if (match) {
             return match[0].toUpperCase();
         }
         return null;
     }).find(function (element) { return element; });
};

Client.prototype.surviveConferenceThrottle = function(num) {
    // Return true if we survive throttling based on time
    if (this.throttleConferenceDate === null) {
        // no previous throttle, reset and survive
        this.throttleConferenceDate = new Date();
        return true;
    }
    if ((new Date() - this.throttleConferenceDate) < timeThrottleMilliseconds) {
        if (num <= this.surviveConferenceNum) {
            // last entry is too recent, do not survive time throttle
            return false;
        }
    }
    // reset and survive
    this.throttleConferenceDate = new Date();
    this.throttleConferenceNum = num;
    return true;
};

Client.prototype.surviveSinceThrottle = function(channel) {
    // Return true if we survive throttling based on time
    if (this.throttleDates[channel] === undefined) {
        // no previous throttle, reset and survive
        this.throttleDates[channel] = new Date();
        return true;
    }
    if ((new Date() - this.throttleDates[channel]) < timeThrottleMilliseconds) {
        // last entry is too recent, do not survive time throttle
        return false;
    }
    // reset and survive
    this.throttleDates[channel] = new Date();
    return true;
};

Client.prototype.surviveContentThrottle = function(channel, message) {
    // Return true if we survive throttling based on content
    if (this.throttleContents[channel] === undefined) {
        // no previous throttle, reset and survive
        this.throttleContents[channel] = [];
    }
    if (this.throttleContents[channel].indexOf(message) < 0) {
        // entry is not in queue
        // enqueue entry
        this.throttleContents[channel].push(message);
        // dequeue to make fixed length queue if necessary
        if (this.throttleContents[channel].length > contentThrottleLength) {
            this.throttleContents[channel].shift();
        }
        return true;
    }
    // entry is in queue, do not update or survive content throttle
    return false;
};

Client.prototype.noYoureTalk = function(from, text) {
    text = text.toLowerCase().trim();
    // return result of first function that has a result
    return [this.simpleSubstrings, this.substrings, this.simpleStrings, this.exps].map(function (fn) {
        return fn(from, text);
    }).find(function (element) { return element; });
};

Client.prototype.wordToCommand = function(word) {
    var commands = {
        'hi': this.hi,
        'stats': this.stats,
        'latest': this.latest,
        'recentbad': this.recentBad,
        'peerstatus': this.peerStatus,
        'peerstatusbad': this.peerStatusBad        
    };
    if (word in commands) {
        return commands[word];
    }
    return null;
};

Client.prototype.wordToCommandPm = function(word) {
    var command = this.wordToCommand(word);
    if (command === null) {
        // add additional commands only available in pm
        var commands = {
            'die': this.die,
            'help': this.help,
        };
        if (word in commands) {
            return commands[word];
        }
        return this.errorMessage;        
    }
    return command;
};

Client.prototype.pm = function(nick, text, message) {
    var words = this.textToCommands(text);
    if (words) {
        var command = this.wordToCommandPm(words[0]);
            if (command !== null) {
                command(this, nick, null, text, message);
            };
    }
};

Client.prototype.channelMessage = function(from, to, text, message) {
    if (text.indexOf('!') == 0) {
        // respond to commands in channel starting with !        
        text = text.replace('!', '');
        var words = this.textToCommands(text);
        if (words) {
            var command = this.wordToCommand(words[0]);
            if (command !== null) {
                command(this, from, to, text, message);
            };
        }
    } else if (text.indexOf(this.nick + ':') == 0) {
        // respond to commands in channel starting with channel hails
        text = text.replace(this.nick + ':', '');
        var words = this.textToCommands(text);
        if (words) {
            var command = this.wordToCommand(words[0]);
            if (command !== null) {
                command(this, from, to, text, message);
            };
        }
    } else if (this.noisyChannels.indexOf(message.args[0]) > -1) {
        // respond to talking in noisychannels
        message = this.noYoureTalk(from, text);
        if (message) {
            if (this.surviveSinceThrottle(to)) {
                if (this.surviveContentThrottle(to, message)) {                
                    this.sayOrSay(from, to, message);
                }
            }
        }
    }
};

Client.prototype.start = function(server, nick, opt) {
    var fifthSecond = 200;
    
    var self = this;    
    // respond to commands in pm
    this.addListener("pm", this.pm);
    // respond to talking in channels
    this.addListener("message#", this.channelMessage);
    // deal with errors, necessary to avoid crash
    this.addListener('error', function(message) {
        this.log('error: ', message);
    });

    irc.Client.call(this, server, nick, opt);    

    setInterval(function() {
        self.doSays();
    }, fifthSecond);
};

module.exports = {
    Client: Client
};
