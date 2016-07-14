var request = require('request');
var express = require('express');
var ical = require('ical-generator');
var app = express();

var cache = {
    'data': null,
    'time': null,
    'TTL': 1000*60*5 
}

var dataToCal = function (data) {
    events = data.schedule.map(function (eventData, idx, arr) {
        var event = {};
        event.start = new Date(eventData.date);
        event.end = new Date((new Date(eventData.date).getTime() + (eventData.duration * 60 * 1000)));
        event.summary = eventData.title;
        event.description = eventData.description;
        event.location = eventData.service;
        return event;
    });

    cal = ical({domain: 'easyallies.com', name: 'EasyAllies Schedule', events: events});

    return cal.toString();
}

app.get('/', function(req, res) {
    request_time = new Date();
    res.type('text/calendar');
    res.setHeader('Content-disposition', 'attachment; filename=easyallies.ical');
    if (cache.data === null && cache.time === null || (request_time - cache.time) - cache.TTL > 0) {
        //console.log(request_time-cache.time - cache.TTL)
        console.log('refreshing data');
        request('http://easyallies.com/api/site/getHome', function (err, resp, bod) {
            if (!err && resp.statusCode == 200) {
                console.log('data refreshed');
                cache.data = dataToCal(JSON.parse(bod));
                cache.time = request_time;
                res.type('ical');
                res.send(cache.data);
            }
        });
    } else {
        res.type('ical');
        res.send(cache.data);
    }
});

app.listen(3000, function() {
    console.log('app listening on port 3000')
})