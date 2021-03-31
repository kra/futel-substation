/* object to emit useful lines of text */

var metrics_util = require('./metrics_util');
var moment = require('moment');

var defaultExtensions = {
    '510': {'name': 'central st', 'activityAge': 2},
    '515': {'name': 'breckenridge st', 'activityAge': 2},
    '530': {'name': 'oskar curbside', 'activityAge': 2},
    //'610': {'name': 'crossclinton', 'activityAge': 2},
    '615': {'name': 'robotron', 'activityAge': 2},
    '620': {'name': 'souwester', 'activityAge': 7},
    //'625': {'name': 'upright', 'activityAge': 2},
    '630': {'name': 'ypsi', 'activityAge': 2},
    '640': {'name': 'killingsworth st', 'activityAge': 7},
    '655': {'name': 'taylor st', 'activityAge': 2},
    '660': {'name': 'open signal', 'activityAge': 2},
    '670': {'name': 'r2d2', 'activityAge': 2},
    '680': {'name': 'xnor', 'activityAge': 3},
    //'690': {'name': 'detroit bus co', 'activityAge': 2},
    '695': {'name': 'hoyt', 'activityAge': 2}
};

function Info(dbFileName) {
    this.dbFileName = dbFileName;
    this.peerStatuses = new Object();
    var self = this;
    Object.keys(defaultExtensions).forEach(
        function foo(element) {
            self.peerStatuses[element] = self.statusToPeerStatus(null);
        })
}

Info.prototype.peerExtensionToExtension = function(extension) { return extension.replace(/^SIP\//, '') }

Info.prototype.statusToPeerStatus = function(status) { return {'status': status, 'timestamp': new Date()}; }

Info.prototype.peerStatusAction = function(peer, status) {
    // Update status for peer in peerStatuses.
    // To be called for incoming peer status message.
    this.peerStatuses[this.peerExtensionToExtension(peer)] = this.statusToPeerStatus(status);
};

Info.prototype.peerStatusStrings = function(peerStatuses, filterStatuses) {
    var self = this;
    if (filterStatuses === undefined) { filterStatuses = [] }
        
    return Object.keys(peerStatuses).filter(
        // filter out keys not matching defaultExtensions
        function(key) {
            return Object.keys(defaultExtensions).some(
                function foo(element) { return key.includes(element); })
        }
    ).filter(
        // filter out entries with statuses in filterStatuses
        function(key) { return !(filterStatuses.indexOf(peerStatuses[key].status) >= 0); }
    ).sort(
        // sort by timestamp
        function(x, y) { return peerStatuses[y].timestamp - peerStatuses[x].timestamp; }
    ).map(
        // format into pretty strings
        function(key) {
            formatTimestamp = function(dateString) {
                return moment(dateString).format('LLL');
            }
            return self.prettyExtensionString(key) + ' ' + peerStatuses[key].status + ' ' + formatTimestamp(peerStatuses[key].timestamp);
        });
};

Info.prototype.peerStatus = function() {
    out = [];    
    this.peerStatusStrings(this.peerStatuses).forEach(function(line) {out.push(line);});
    return out;
};

Info.prototype.peerStatusBad = function() {
    out = []
    this.peerStatusStrings(this.peerStatuses, ['Registered', 'Reachable']).forEach(function(line) {out.push(line);});
    return out;
};

Info.prototype.reportStats = function(days, rows) {
    rows = rows.map(function (row) { return row.name + ":" + row.count; });
    out = [];
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
        return str + '(' + defaultExtensions[str]['name'] + ')';
    }
};

Info.prototype.formatTimestamp = function(timestampString) {
    if (timestampString) {
        return moment(timestampString).format('LLL');
    } else {
        return timestampString;
    }
}

Info.prototype.metricToString = function(metric) {
    var self = this;
    return self.prettyExtensionString(metric.channel_extension) + " " + self.formatTimestamp(metric.timestamp) + " " + metric.name;
}

Info.prototype.reportLatest = function(results) {
    var self = this;    
    results = results.map(function (result) {
        return self.metricToString(result);
    });
    out = [];
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

// return true if timestamp of result is older than yesterday
Info.prototype.filterDate = function(result, days) {
    result = new Date(result.timestamp);
    yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - days);
    return yesterday > result
};

// output most recent bad event from extension
Info.prototype.recentBadHealth = function(extension, callback) {
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
            results = results.filter(function (result) {
                activityAge = defaultExtensions[result.channel_extension].activityAge
                return (
                    metrics_util.badEvents.includes(result.name) ||
                        self.filterDate(result, activityAge))
            });
            results = results.map(function (result) {
                return self.metricToString(result);
            });
            callback(results);
        });
};

module.exports = {
    Info: Info
};
