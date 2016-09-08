var _ = require('lodash');
var jsdom = require('jsdom');
var fs = require('fs');
var EventNodeParser = require('./event-node-parser.js');

jsdom.env({
    url: 'http://bookforum.ua/events/page/1',
    scripts: ['http://code.jquery.com/jquery.js'],
    done: function (err, window) {
        var $ = window.$;
        var eventsNodes = $.makeArray($('.events_list .event_single'));
        var events = _.map(eventsNodes, function (event) {
            var eventParser = new EventNodeParser($, event);
            return eventParser.getNodeData();
        });
        console.log(events)
    }
});

