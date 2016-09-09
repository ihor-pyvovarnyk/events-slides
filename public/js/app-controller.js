angular
    .module('EventsSlides')
    .controller('appController', AppController);

function AppController($scope, $http, $interval, $sce) {
    $scope.isLoading = true;
    $scope.loadingProgress = 0;
    $scope.event = null;
    $scope.formateDate = formateDate;
    $scope.formatTimeRange = formatTimeRange;
    $scope.getGmapsIFrameAddress = getGmapsIFrameAddress;

    var eventsList = [];
    var perPage = 30;
    var approxPageNum = 42; // For progress
    var eventsUpdateInterval = 2 * 60 * 1000; // Update slide each 2 minutes
    var eventsUpdateIntervalId = 0;
    var loadAllEventsInterval = 30 * 60 * 1000; // Reload events list each half ah hour
    var gogleMapsApiKey = 'AIzaSyDddpqH09tA4SlW7NGqd6PRkAoYMJVyN3I';

    init();

    function init() {
        loadAllEvents();
        $interval(loadAllEvents, loadAllEventsInterval);
    }

    function loadAllEvents() {
        $scope.isLoading = true;
        $interval.cancel(eventsUpdateIntervalId);
        eventsList = [];
        function getEventsPagePromise(page) {
            page = page || 1;
            return new Promise(function (resolve, reject) {
                loadEventsPage(page).then(function (newEvents) {
                    resolve(newEvents);
                    if (newEvents.length == perPage) {
                        getEventsPagePromise(page + 1).then(cancatEvents);
                    } else {
                        $scope.isLoading = false;
                        play();
                    }
                });
            })
        }
        function cancatEvents(newEvents) {
            eventsList = eventsList.concat(newEvents);
        }
        moveProgressByPage(0);
        getEventsPagePromise().then(cancatEvents);
    }

    function loadEventsPage(page) {
        moveProgressByPage(page);
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

    function moveProgressByPage(page) {
        $scope.loadingProgress = Math.ceil(page / approxPageNum * 100);
    }

    function play() {
        playIteration();
        eventsUpdateIntervalId = $interval(playIteration, eventsUpdateInterval);
    }

    function playIteration() {
        var now = moment();
        var futureEvents = eventsList.filter(function (event) {
            return event.startTime.isAfter(now) || event.endTime.isAfter(now);
        });
        $scope.event = futureEvents[0] || null;
    }

    function randInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function modifyRawEvents(events) {
        return events.map(function (event) {
            event.startTime = moment(event.startTime);
            event.endTime = moment(event.endTime);
            return event;
        });
    }

    function formateDate(date) {
        var day = date.date();
        var month = date.month();
        var months = ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв',
            'Лип', 'Серп', 'Вер', 'Жовт', 'Лист', 'Груд'];
        return $sce.trustAsHtml(day + ' <em>' + months[month] + '</em>');
    }

    function formatTimeRange(time1, time2) {
        return time1.format('HH:mm') + ' - ' + time2.format('HH:mm');
    }

    function getGmapsIFrameAddress(event) {
        var key = gogleMapsApiKey;
        var query = event.location;
        var url =  'https://www.google.com/maps/embed/v1/place?key=' + key + '&q=' + encodeURIComponent(query);
        return $sce.trustAsResourceUrl(url);
    }
}