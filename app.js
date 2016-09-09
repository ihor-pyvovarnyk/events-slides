var express = require('express');
var views = require('./views.js');
var api = require('./api.js');
var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/', views.index);
app.get('/api/get_events', api.get_events);

app.listen(8080);