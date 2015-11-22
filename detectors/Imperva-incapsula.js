var utils = require('../libs/utils');

var detector = {};
detector.name = 'Imperva/Incapsula';

// feel free to ad credits, note and changes !
detector.info = [
    'http://www.imperva.com/'
];

detector.score = 0;
detector.scoreMax = 18;

detector.analyze = function(data,cb) {

    data.response.normal.score = 0;
    data.response.noHost.score = 0;

    if (utils.setCookieNameMatch(/visid_incap/,data.response.normal.headers)) {
        data.response.normal.score+= 3;
        detector.score+=3;
    }

    if (utils.setCookieNameMatch(/incap_ses/,data.response.normal.headers)) {
        data.response.normal.score+= 3;
        detector.score+=3;
    }

    if (data.response.normal.headers['x-cdn'] == "Incapsula") {
        data.response.normal.score+= 3;
        detector.score+=3;
    }

    if (data.response.noHost.status.code == 503 && data.response.noHost.status.message == 'Service Unavailable') {
        data.response.noHost.score+= 3;
        detector.score+=3;
    }

    if (data.response.badHost.status.code == 503 && data.response.badHost.status.message == 'Service Unavailable') {
        data.response.badHost.score+= 3;
        detector.score+=3;
    }

    if (data.response.commandInjection.body.match(/Incapsula/ig)) {
        data.response.commandInjection.score+= 3;
        detector.score+=3;
    }

    cb({
        name:detector.name,
        score:detector.score,
        scoreMax:detector.scoreMax,
        ratio:Math.round((detector.score*100)/detector.scoreMax)
    });
};

module.exports = detector;