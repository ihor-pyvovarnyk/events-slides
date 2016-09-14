angular
    .module('EventsSlides')
    .controller('appController', AppController);

function AppController($scope, $http, $interval, $sce) {
    $scope.isLoading = true;
    $scope.now = null;
    $scope.formateDate = formateDate;
    $scope.formatTimeRange = formatTimeRange;
    $scope.eventsList = [];
    $scope.displayedEventsList = [];

    var perPage = 30;
    var eventsUpdateInterval = 30 * 1000;
    var eventsUpdateIntervalId = 0;
    var loadAllEventsInterval = 30 * 60 * 1000; // Reload events list each half ah hour
    var displayedEventsListOffset = 0;
    var displayedEventsListCount = 3;

    init();

    function init() {
        loadAllEvents();
        $interval(loadAllEvents, loadAllEventsInterval);
    }

    function loadAllEvents() {
        var eventsList = [];
        $scope.now = moment();
        $scope.isLoading = true;
        function afterPageLoading(page, newEvents) {
            concatEvents(newEvents);
            if (isLoadNext(newEvents)) {
                var promise = loadEventsPage(page + 1);
                if (promise) {
                    promise.then(afterPageLoading.bind(this, page + 1));
                }
            } else {
                $scope.isLoading = false;
                displayedEventsListOffset = 0;
                $interval.cancel(eventsUpdateIntervalId);
                $scope.eventsList = eventsList;
                play();
            }
        }
        function isLoadNext(events) {
            var tomorrowEvents = events.filter(function (event) {
                return event.startTime.isSame($scope.now, 'day');
            });
            return events.length == perPage && tomorrowEvents.length == 0;
        }
        function concatEvents(newEvents) {
            var todayEvents = newEvents.filter(function (event) {
                return event.startTime.isSame($scope.now, 'day');
            });
            eventsList = eventsList.concat(todayEvents);
        }
        loadEventsPage(1).then(afterPageLoading.bind(this, 1));
    }

    function loadEventsPage(page) {
        page = page || 1;
        function modifyRawEvents(events) {
            return events.map(function (event) {
                event.startTime = moment(event.startTime);
                event.endTime = moment(event.endTime);
                return event;
            });
        }
        return $scope.isLoading ? $http({
            method: 'GET',
            url: '/api/get_events?page=' + page
        }).then(function (response) {
            var newEvents = modifyRawEvents(response.data)
            return newEvents;
        }, function () {
            console.log('Events loading error');
            $scope.isLoading = false;
        }) : false;
    }

    function play() {
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