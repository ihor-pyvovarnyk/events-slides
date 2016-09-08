var _ = require('lodash');

function EventNodeParser(jQuery, eventNode) {
    var self = this;
    self.$ = jQuery;
    self.eventNode = eventNode;
    self.$event = self.$(self.eventNode);
}

EventNodeParser.prototype.getNodeData = function () {
    var self = this;
    return {
        eventId:      _.parseInt(self.$event.data('event_id'), 10),
        title:        self._getText('.ev_info h3'),
        type:         self._getText('.ev_info .ev_below_title'),
        date:         self._getText('.ev_when .start'),
        time:         self._getText('.ev_info .ev_meta .ev_time'),
        location:     self._getText('.ev_info .ev_meta .ev_location'),
        locationName: self._getText('.ev_info .ev_meta .ev_location_name'),
        details:      self._getDetailText('Детальніше'),
        organizer:    self._getDetailText('Організатор'),
        participants: self._getDetailText('Учасники'),
        link:         self._getDetailChildNodes('Лінк на цю подію').find('a.link').attr('href')
    };
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