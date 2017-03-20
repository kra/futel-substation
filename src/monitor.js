var info_mod = require('./info');

var config = require('./config');

var logArray = function(result) { result.map(function (line) { console.log(line); })};

var info = new info_mod.Info(config.config.dbFileName);

info.recentBad(logArray);
info.latest(null, logArray);
