var info_mod = require('./info');
var client_mod = require('./client');
var snspoller = require('./snspoller');

var config = require('./config');
var secrets = require('./secrets');

// irc client config
// ms to wait between irc connect retries
var retryDelay = 5 * 60 * 1000;
var millisecondsOfSilenceBeforePingSent = 5 * 1000;

var info = new info_mod.Info(config.config.dbFileName);
var client = new client_mod.Client(
    info,
    config.config.noisyChannels,
    config.config.botPassword);

// XXX need new aws creds
// var poller = snspoller.Poller(
//     secrets.config.sqsUrl,
//     secrets.config.awsAkey,
//     secrets.config.awsSecret,
//     config.config.eventHostname,
//     client);

client.start(
    config.config.server,
    config.config.botName,
    {channels: config.config.channels,
     userName: config.config.userName,
     realName: config.config.realName,
     retryDelay: retryDelay,
     millisecondsOfSilenceBeforePingSent: millisecondsOfSilenceBeforePingSent}
);
