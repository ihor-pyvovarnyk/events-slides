angular
    .module('EventsSlides')
    .controller('appController', AppController);

function AppController($scope, $http, $interval, $sce) {
    var perPage = 30;
    var eventsUpdateInterval = 30 * 1000; // Shift displayed events list
    var eventsUpdateIntervalId = 0;
    var loadAllEventsInterval = 30 * 60 * 1000; // Reload events list each half ah hour
    var displayedEventsListOffset = 0;
    var displayedEventsListCount = 3;
    var displayedTimeRange = 1 * 60 * 60 * 1000; // 1 hour time range

    $scope.isLoading = true;
    $scope.dateTime = moment();
    $scope.formateDate = formateDate;
    $scope.formatTimeRange = formatTimeRange;
    $scope.eventsList = getInitialEventsList();
    $scope.eventsListByTimeRange = getEventsListByTimeRange();
    $scope.displayedEventsList = [];

    init();

    function init() {
        if ($scope.eventsList.length) {
            play();
        }
        loadAllEvents();
        $interval(loadAllEvents, loadAllEventsInterval);
    }

    function getInitialEventsList() {
        var events = [];
        if (window.localStorage && localStorage.getItem('eventsList')) {
            events = JSON.parse(localStorage.getItem('eventsList'));
            events = modifyRawEvents(events);
        }
        return events;
    }

    function getEventsListByTimeRange() {
        var now = moment();
        return $scope.eventsList.filter(function (event) {
            var startDiff = event.startTime.diff(now);
            var endDiff = event.endTime.diff(now);
            return (startDiff >= 0 && startDiff <= displayedTimeRange) ||
                   (endDiff >= 0 && endDiff <= displayedTimeRange) ||
                   (startDiff <= 0 && endDiff >= displayedTimeRange);
        });
    }

    function updateEventsList(events) {
        $scope.eventsList = events;
        if (window.localStorage) {
            localStorage.setItem('eventsList', JSON.stringify(events));
        }
    }

    function loadAllEvents() {
        var eventsList = [];
        $scope.isLoading = true;
        $scope.dateTime = moment();
        function afterPageLoading(page, newEvents) {
            eventsList = eventsList.concat(newEvents);
            if (isLoadNext(newEvents)) {
                var promise = loadEventsPage(page + 1);
                if (promise) {
                    promise.then(afterPageLoading.bind(this, page + 1));
                }
            } else {
                $scope.isLoading = false;
                eventsList = filterEvents(eventsList);
                updateEventsList(eventsList);
                play();
            }
        }
        function isLoadNext(events) {
            var now = moment();
            var tomorrowEvents = events.filter(function (event) {
                return !event.startTime.isSame(now, 'day') &&
                        event.startTime.diff(now) > 0;
            });
            return events.length == perPage && tomorrowEvents.length == 0;
        }
        function filterEvents(newEvents) {
            var now = moment();
            var targetLocationNames = [
                'Палац Потоцьких',
                'Палац мистецтв',
                'давньої української книги'
            ].map(function (name) {
                return name.toLowerCase();
            });
            return newEvents
                .filter(function (event) {
                    return event.startTime.isSame(now, 'day') &&
                           event.endTime.diff(now) > 0;
                })
                .filter(function (event) {
                    var loc = event.locationName.toLowerCase();
                    for (var i = 0; i < targetLocationNames.length; i++) {
                        if (loc.indexOf(targetLocationNames[i]) !== -1) {
                            return true;
                        }
                    }
                    return false;
                });
        }
        loadEventsPage(1).then(afterPageLoading.bind(this, 1));
    }

    function loadEventsPage(page) {
        page = page || 1;
        return $scope.isLoading ? $http({
            method: 'GET',
            url: '/api/get_events?page=' + page
        }).then(function (response) {
            return modifyRawEvents(response.data);
        }, function () {
            console.log('Events loading error');
            $scope.isLoading = false;
        }) : false;
    }

    function modifyRawEvents(events) {
        return events.map(function (event) {
            event.startTime = moment(event.startTime);
            event.endTime = moment(event.endTime);
            return event;
        });
    }

    function play() {
        $interval.cancel(eventsUpdateIntervalId);
        var eventsList = $scope.eventsListByTimeRange = getEventsListByTimeRange();
        refillDisplayedList(eventsList, false);
        eventsUpdateIntervalId = $interval(playIteration, eventsUpdateInterval);
    }

    function playIteration() {
        var eventsList = $scope.eventsListByTimeRange = getEventsListByTimeRange();
        refillDisplayedList(eventsList,
            $scope.displayedEventsList.length >= displayedEventsListCount);
    }

    function refillDisplayedList(eventsList, isNext) {
        if (eventsList.length > displayedEventsListCount) {
            var step = isNext ? 1 : 0;
            displayedEventsListOffset = (displayedEventsListOffset + isNext) % eventsList.length;
            $scope.displayedEventsList = [];
            for (var i = 0; i < displayedEventsListCount; i++) {
                var index = (displayedEventsListOffset + i) % eventsList.length;
                $scope.displayedEventsList.push(eventsList[index]);
            }
        } else {
            displayedEventsListOffset = 0;
            $scope.displayedEventsList = eventsList;
        }
    }

    function formateDate(date) {
        var day = date.date();
        var month = date.month();
        var months = ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв',
            'Лип', 'Серп', 'Вер', 'Жовт', 'Лист', 'Груд'];
        return $sce.trustAsHtml('<h1>' + day + '</h1><em>' + months[month] + '</em>');
    }

    function formatTimeRange(time1, time2) {
        return time1.format('HH:mm') + ' - ' + time2.format('HH:mm');
    }
}