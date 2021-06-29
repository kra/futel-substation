var info_mod = require('./info');
var util = require('util');
// XXX
var dbFileName = './metrics.db';
var defaultStatsDays = 60;


var say = function(message) {
    console.log(message);
};

var latest = function(info, args) {
    var days = args.shift() || null;
    var extension = args.shift() || null;
    say("latest channel events");
    info.latest(
        extension,
        function(result) {
            result.map(function (line) { say(line); });
        });
};

var stats = function(info, args) {
    var days = args.shift() || null;
    var extension = args.shift() || null;
    say('most frequent events last ' + days + ' days');  
    info.stats(
        days,
        extension,
        function(result) {
            result.map(function (line) { say(line); });
        });
};

var recentBad = function(info, args) {
    say("recent bad health events");
    info.recentBadHealth(
        null,
        function(result) {
            result.map(function (line) { say(line); });
        });
};

var recentStats = function(info, args) {
    var days = args.shift() || null;
    var extension = args.shift() || null;
    say("recent stats");
    info.recentStats(
        days,
        extension,
        function(result) {
            result.map(function (line) { say(line); });
        });
};

var wordToCommand = function(word) {
    var commands = {
        'stats': stats,
        'latest': latest,
        'recentbad': recentBad,
        'recentstats': recentStats
    };
    if (word in commands) {
        return commands[word];
    }
    return null;
};


var info = new info_mod.Info(dbFileName);

var args = process.argv;
args.shift();
args.shift();
command = args.shift();
var command = wordToCommand(command);
command(info, args);
