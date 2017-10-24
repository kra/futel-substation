var arrayCmp = function(left, right) {
    return left.length == right.length && left.every(function(v, i) { return v === right[i] });
}

module.exports = {
    arrayCmp: arrayCmp
};
