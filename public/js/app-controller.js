angular
    .module('EventsSlides')
    .controller('appController', AppController);

function AppController($scope, $http, $interval, $sce) {
    $scope.isLoading = true;
    $scope.now = moment();
    $scope.formateDate = formateDate;
    $scope.formatTimeRange = formatTimeRange;
    $scope.eventsList = getInitialEventsList();
    $scope.displayedEventsList = [];

    var perPage = 30;
    var eventsUpdateInterval = 30 * 1000; // Shift displayed events list
    var eventsUpdateIntervalId = 0;
    var loadAllEventsInterval = 30 * 60 * 1000; // Reload events list each half ah hour
    var displayedEventsListOffset = 0;
    var displayedEventsListCount = 3;

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

    function updateEventsList(events) {
        $scope.eventsList = events;
        if (window.localStorage) {
            localStorage.setItem('eventsList', JSON.stringify(events));
        }
    }

    function loadAllEvents() {
        var eventsList = [];
        $scope.now = moment();
        $scope.isLoading = true;
        function afterPageLoading(page, newEvents) {
            eventsList = eventsList.concat(newEvents);
            if (isLoadNext(newEvents)) {
                var promise = loadEventsPage(page + 1);
                if (promise) {
                    promise.then(afterPageLoading.bind(this, page + 1));
                }
            } else {
                $scope.isLoading = false;
                displayedEventsListOffset = 0;
                eventsList = filterEvents(eventsList);
                updateEventsList(eventsList);
                play();
            }
        }
        function isLoadNext(events) {
            var tomorrowEvents = events.filter(function (event) {
                return !event.startTime.isSame($scope.now, 'day') &&
                        event.startTime.diff($scope.now) > 0;
            });
            return events.length == perPage && tomorrowEvents.length == 0;
        }
        function filterEvents(newEvents) {
            var targetLocationNames = [
                'Палац Потоцьких',
                'Палац мистецтв',
                'давньої української книги'
            ].map(function (name) {
                return name.toLowerCase();
            });
            return newEvents
                .filter(function (event) {
                    return event.startTime.isSame($scope.now, 'day') &&
                           event.endTime.diff($scope.now) > 0;
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
        $scope.displayedEventsList = $scope.eventsList.slice(0, displayedEventsListCount);
        if ($scope.eventsList.length > displayedEventsListCount) {
            eventsUpdateIntervalId = $interval(playIteration, eventsUpdateInterval);
        }
    }

    function playIteration() {
        if (displayedEventsListOffset < $scope.eventsList.length) {
            displayedEventsListOffset++;
        } else {
            displayedEventsListOffset = -1 * displayedEventsListCount;
        }
        $scope.displayedEventsList = $scope.displayedEventsList.slice(1, displayedEventsListCount);
        var index = (displayedEventsListOffset + displayedEventsListCount) % $scope.eventsList.length;
        $scope.displayedEventsList.push($scope.eventsList[index]);
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