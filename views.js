exports.index = function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
};