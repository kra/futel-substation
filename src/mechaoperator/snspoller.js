var AsyncPolling = require('async-polling');
var AWS = require('aws-sdk');

var pollMilliSeconds = 5000;

var removeFromQueue = function(sqs, sqsUrl, message) {
    sqs.deleteMessage({
        QueueUrl: sqsUrl,
        ReceiptHandle: message.ReceiptHandle
    }, function(err, data) {
        if (err !== null) {
            console.log(err);
        }
    });
};

var receiveMessage = function(sqs, sqsUrl, hostname, eventMap) {
    sqs.receiveMessage({
        QueueUrl: sqsUrl,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 60 // seconds, how long to lock messages
    }, function(err, data) {
        if (err !== null) {
            console.error(err);
        } else {
            if (data.Messages !== undefined) {
                data.Messages.forEach(function(message) {
                    var body = JSON.parse(message.Body);
                    var body = JSON.parse(body.Message);
                    if (body.hostname == hostname) {
                        //console.log(body.event);                        
                        var fn = eventMap[body.event.Event];
                        if (fn) {
                            fn(body);
                        } else {
                            var fn = eventMap['defaultEventAction'];
                            if (fn) {
                                fn(body);
                            }
                        }
                    };
                    removeFromQueue(sqs, sqsUrl, message);
                });
            }
        }
    });
};

var poll = function(sqsUrl, akey, secret, hostname, eventMap) {
    // Set up and run AsyncPolling event loop.
    AWS.config.update({accessKeyId: akey, secretAccessKey: secret});
    AWS.config.update({region: 'us-west-2'})
    var sqs = new AWS.SQS();
    var polling = AsyncPolling(function (end) {
        receiveMessage(sqs, sqsUrl, hostname, eventMap);
        end(null, "result");
    }, pollMilliSeconds);
    polling.on('result', function (result) {
        //
    });
    polling.on('error', function (error) {
        console.error('polling error:', error);
    });    
    polling.run();
};

function Poller(sqsUrl, awsAkey, awsSecret, eventHostname, client) {
    // Container for event actions and map from event strings to actions.
    // Instantiate to begin poller event loop.
    var defaultEventAction = function(body) {
    };
    var confbridgeJoinAction = function(body) {
        //client.confbridgeJoinAction();
        client.confbridgeJoinAction(body.event.BridgeNumChannels);
    };
    //var confbridgeLeaveAction = function(body) {
    //    client.confbridgeLeaveAction();
    //};
    var peerStatusAction = function(body) {
        // Tell info to update status for peer in given message body.
        client.peerStatusAction(body.event.Peer, body.event.PeerStatus);
    };
    
    var pollerEventMap = {
        'ConfbridgeJoin': confbridgeJoinAction,
        //'ConfbridgeLeave': confbridgeLeaveAction,
        'PeerStatus': peerStatusAction,
        'defaultEventAction': defaultEventAction,
    };
    poll(
        sqsUrl,
        awsAkey,
        awsSecret,
        eventHostname,
        pollerEventMap);
}

module.exports = { Poller: Poller };
