/* object to emit useful lines of text */

var metrics_util = require('./metrics_util');
var moment = require('moment');

var defaultExtensions = {
    '630': 'ypsi',
    '640': 'xhurch',
    '655': 'taylor st',
    '667': 'oskar indoors',
    '668': 'oskar curbside',
    '669': 'oskar office',
    '670': 'r2d2',
    '680': 'xnor',
};

function Info(dbFileName) {
    this.dbFileName = dbFileName;
    this.peerStatuses = new Object();
    var self = this;
    Object.keys(defaultExtensions).forEach(
        function foo(element) {
            self.peerStatuses[self.extensionToPeerExtension(element)] = self.statusToPeerStatus(null);
        })
}

// this is kind of bogus, we know we are getting SIP extensions in real life, but our defaults are just
// the extensions without protocol parts, so fake them
Info.prototype.extensionToPeerExtension = function(extension) { return 'SIP/' + extension }

Info.prototype.statusToPeerStatus = function(status) { return {'status': status, 'timestamp': new Date()}; }

Info.prototype.peerStatusAction = function(peer, status) {
    this.peerStatuses[peer] = {'status': status, 'timestamp': new Date()};
};

Info.prototype.peerStatusStrings = function(peerStatuses, filterStatuses) {
    if (filterStatuses === undefined) { filterStatuses = [] }
        
    return Object.keys(peerStatuses).filter(
        function(key) {
            // filter out keys not matching defaultExtensions
            return Object.keys(defaultExtensions).some(
                function foo(element) { return key.includes(element); })
        }
    ).filter(
        function(key) { return !(filterStatuses.indexOf(peerStatuses[key].status) >= 0); }
    ).sort(
        function(x, y) { return peerStatuses[y].timestamp - peerStatuses[x].timestamp; }
    ).map(
        function(key) {
            formatTimestamp = function(dateString) {
                return moment(dateString).format('LLL');
            }
            return key + ' ' + peerStatuses[key].status + ' ' + formatTimestamp(peerStatuses[key].timestamp);
        });
};

Info.prototype.peerStatus = function() {
    out = [];    
    out.push('Peer statuses:');
    this.peerStatusStrings(this.peerStatuses).forEach(function(line) {out.push(line);});
    return out;
};

Info.prototype.peerStatusBad = function() {
    out = []
    out.push('Peer statuses:');
    this.peerStatusStrings(this.peerStatuses, ['Registered', 'Reachable']).forEach(function(line) {out.push(line);});
    return out;
};

Info.prototype.reportStats = function(days, rows) {
    rows = rows.map(function (row) { return row.name + ":" + row.count; });
    out = [];
    out.push('most frequent events last ' + days + ' days');
    out.push(rows.join(' '));
    return out;
}

Info.prototype.stats = function(days, extension, callback) {
    var self = this;
    metrics_util.frequent_events(
        self.dbFileName,
        null,
        null,
        days,
        extension,
        function(result) {
            callback(self.reportStats(days, result));
        });
}

Info.prototype.prettyExtensionString = function(str) {
    if (defaultExtensions[str] === undefined) {
        return str;
    } else {
        return str + '(' + defaultExtensions[str] + ')';
    }
};

Info.prototype.metricToString = function(metric) {
    var self = this;
    formatTimestamp = function(dateString) {
        return moment(dateString).format('LLL');
    }
    return self.prettyExtensionString(metric.channel_extension) + " " + formatTimestamp(metric.timestamp) + " " + metric.name;
}

Info.prototype.reportLatest = function(results) {
    var self = this;    
    results = results.map(function (result) {
        return self.metricToString(result);
    });
    out = [];
    out.push("latest channel events");
    out = out.concat(results);    
    return out;
};

Info.prototype.latest = function(extension, callback) {
    var self = this;
    if (extension !== null) {
        var extensions = [extension];
    } else {
        var extensions = Object.keys(defaultExtensions);
    }

    metrics_util.latest_events(
        self.dbFileName,
        extensions,
        function(results) {
            callback(self.reportLatest(results));
        });
};

Info.prototype.reportRecentBad = function(results) {
    var self = this;    
    results = results.map(function (result) {
        return self.metricToString(result);
    });
    out = [];
    out.push("recent bad events");
    out = out.concat(results);
    return out;
};

Info.prototype.recentBad = function(callback) {
    var self = this;
    metrics_util.recentEvents(
        self.dbFileName,
        5,
        null,
        null,
        function(results) {
            callback(self.reportRecentBad(results));
        });
};

module.exports = {
    Info: Info
};
