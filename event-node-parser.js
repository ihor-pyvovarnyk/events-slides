var _ = require('lodash');
var moment = require('moment');
var sprintf = require('sprintf').sprintf;

function EventNodeParser(jQuery, eventNode) {
    var self = this;
    self.$ = jQuery;
    self.eventNode = eventNode;
    self.$event = self.$(self.eventNode);
}

EventNodeParser.prototype.getEventObj = function () {
    var self = this;
    var dataDate = self._getText('.ev_when .start');
    var dataTime = self._getText('.ev_info .ev_meta .ev_time');
    var dateVals = dataDate.replace(/\s+/g, ' ').trim().split(' ');
    var date = _.parseInt(dateVals[0], 10);
    var month = self._getMonthNum(dateVals[1]);
    var time = dataTime.split('-').map(function (t) {
        return t.trim().split(':').map(function (d) {
            return _.parseInt(d, 10);
        });
    });
    var parseParticiants = function (string) {
        return string.split(',').map(function (p) {
            return p.trim();
        });
    }
    return {
        id:           _.parseInt(self.$event.data('event_id'), 10),
        title:        self._getText('.ev_info h3'),
        type:         self._getText('.ev_info .ev_below_title'),
        startTime:    self._formatTime(month, date, time[0]),
        endTime:      self._formatTime(month, date, time[1]),
        location:     self._getText('.ev_info .ev_meta .ev_location'),
        locationName: self._getText('.ev_info .ev_meta .ev_location_name'),
        details:      self._getDetailText('Детальніше'),
        organizer:    self._getDetailText('Організатор'),
        participants: parseParticiants(self._getDetailText('Учасники')),
        link:         self._getDetailChildNodes('Лінк на цю подію').find('a.link').attr('href')
    };
};

EventNodeParser.prototype._getMonthNum = function (month) {
    month = month.toLowerCase();
    var months = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
        'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];
    return _.indexOf(months, month) + 1;
};

EventNodeParser.prototype._formatTime = function (month, date, time) {
    var slice = function (val) {
        return ('0' + val).slice(-2);
    };
    var year = moment().year();
    month = slice(month);
    date = slice(date);
    time[0] = slice(time[0]);
    time[1] = slice(time[1]);
    var timeString = sprintf('%d-%s-%s %s:%s', year, month, date,
        time[0], time[1]);
    return moment(timeString).format();
};

EventNodeParser.prototype._getText = function (selector) {
    var self = this;
    return self.$event.find(selector).first().text().trim();
};

EventNodeParser.prototype._getDetailChildNodes = function (neededTitle) {
    var self = this;
    var $details = self.$event.find('.event_description').first().find('.ev_row_detail .ev_data_cell');
    var neededDetails = _.filter(self.$.makeArray($details), function (detail) {
        return self.$(detail).find('h4').text() == neededTitle;
    });
    return self.$(neededDetails).first().find('p');
};

EventNodeParser.prototype._getDetailText = function (neededTitle) {
    var self = this;
    return self._getDetailChildNodes(neededTitle).text();
};

module.exports = EventNodeParser;