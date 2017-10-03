var info_mod = require('../info');
var dbFileName = 'test/assets/metrics.db'

var info = new info_mod.Info(dbFileName);

info.stats(
    365 * 10,
    null,
    function(result) {
        result.map(function (line) { console.log(line); });
    });
