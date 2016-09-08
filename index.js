var bookforumEvents = require('./bookforum-events.js');

bookforumEvents.getAllEvents(function (events) {
    console.log(events);
});
