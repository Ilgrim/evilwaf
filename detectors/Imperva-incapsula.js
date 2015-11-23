var utils = require('../libs/utils');

var detector = {}

detector.name = 'Imperva/Incapsula';

// feel free to ad credits, note and changes !
detector.info = [
    'http://www.imperva.com/'
];



detector.analyze = function(data,cb) {

    var scoreMax = 18;

    var scores = data.scores[this.name] = {
        noHost:0,
        badHost:0,
        commandInjection:0,
        normal:0,
        total:0
    };

    var response = data.result.response;

    if (utils.setCookieNameMatch(/visid_incap/,response.normal.headers)) {
        scores.normal+=3;
        scores.total+=3;
    }

    if (utils.setCookieNameMatch(/incap_ses/,response.normal.headers)) {
        scores.normal+=3;
        scores.total+=3;
    }

    if (response.normal.headers['x-cdn'] == "Incapsula") {
        scores.normal+=3;
        scores.total+=3;
    }

    if (response.noHost.status.code == 503 && response.noHost.status.message == 'Service Unavailable') {
        scores.noHost+=3;
        scores.total+=3;
    }

    if (response.badHost.status.code == 503 && response.badHost.status.message == 'Service Unavailable') {
        scores.badHost+=3;
        scores.total+=3;
    }

    if (response.commandInjection.body.match(/Incapsula/ig)) {
        scores.commandInjection+=3;
        scores.total+=3;
    }

    scores.ratio = Math.round((scores.total*100)/scoreMax)+'%';

    cb();
    /*{
        name:this.name,
        score:this.score,
        scoreMax:this.scoreMax,
        ratio:Math.round((this.score*100)/this.scoreMax)
    });
    */
};

module.exports = detector;