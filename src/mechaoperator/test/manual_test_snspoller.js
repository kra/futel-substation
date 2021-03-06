var snspoller = require('../snspoller');
var secrets = require('../secrets');
var config = require('../config');

function Client() {}
Client.prototype.noisySay = function(body) { console.log(body); };
Client.prototype.peerStatusAction = function(peer, status) { console.log(peer); console.log(status); };
Client.prototype.confBridgeJoinAction = function() { console.log('confBridgeJoinAction'); };
Client.prototype.confBridgeLeaveAction = function() { console.log('confBridgeLeaveAction'); };
var client = new Client();

var poller = snspoller.Poller(
    secrets.config.sqsUrl,
    secrets.config.awsAkey,
    secrets.config.awsSecret,
    config.config.eventHostname,
    client);
