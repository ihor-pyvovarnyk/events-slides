var _ = require('lodash');
var jsdom = require('jsdom');
var sprintf = require('sprintf').sprintf;
var EventNodeParser = require('./event-node-parser.js');

var URL_BASE = 'http://bookforum.ua/events/page/';
var PER_PAGE = 30;

function getAllEvents(callback) {
    console.log('Parsing bookforum all events');
    var events = [];
    function recursiveIteration(page, finishCallback) {
        getEventsByPage(page, function (eventsPage) {
            events = _.concat(events, eventsPage);
            if (eventsPage.length == PER_PAGE) {
                recursiveIteration(page + 1, finishCallback);
            } else {
                finishCallback();
            }
        });
    }
    recursiveIteration(1, function () {
        callback(events);
    });
};

function getEventsByPage(page, callback) {
    console.log(sprintf('Parsing bookforum events, page %d', page));
    jsdom.env({
        url: URL_BASE + page,
        scripts: ['http://code.jquery.com/jquery.js'],
        done: function (err, window) {
            var $ = window.$;
            var eventsNodes = $.makeArray($('.events_list .event_single'));
            var events = _.map(eventsNodes, function (event) {
                var eventParser = new EventNodeParser($, event);
                return eventParser.getEventObj();
            });
            if (events.length == 0) {
                console.log('Empty page');
            }
            callback(events);
        }
    });
}

module.exports = {
    getAllEvents: getAllEvents,
    getEventsByPage: getEventsByPage
};
