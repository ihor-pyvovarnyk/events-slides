var _ = require('lodash');
var bookforumEvents = require('./bookforum-events.js');

exports.get_events = function (req, res) {
    var page = _.parseInt(req.query.page, 10);
    res.setHeader('Content-Type', 'application/json');
    bookforumEvents.getEventsByPage(page, function (events) {
        res.send(JSON.stringify(events));
    });
};