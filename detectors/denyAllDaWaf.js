var utils = require('../libs/utils');

var detector = {};
detector.name = 'DenyAll DAWAF';
detector.info = [
    'http://www.denyall.com/',
    'DAWAF is the new name of Bee Ware i-Suite since 2014',
    'Reverse Proxy is based on apache 2'
];

detector.score = 0;
detector.scoreMax = 15;

detector.analyze = function(data,cb) {

    if (utils.isApacheError(400,data.response.noHost)) {
        // by default, apache send a 400 error when no host header
        data.response.noHost.score = 3;
        detector.score+=3;
    }
    if (utils.isApacheError(403,data.response.commandInjection)) {
        // by default, DAWAF send a 403 when attack detected
        data.response.commandInjection.score = 5;
        detector.score+=5;
    }
    if (utils.isApacheError(403,data.response.badHost)) {
        // by default, DAWAF send a 403 when header host value does not match DAWAF setup
        data.response.badHost.score = 2;
        detector.score+=2;
    }
    if (utils.isApacheError(400,data.response.badHost)) {
        // @todo new default behavior ? have to double check
        data.response.badHost.score = 1;
        detector.score+=1;
    }

    if (utils.setCookieNameMatch(/BWFSESSID/,data.response.normal.headers)) {
        // No cookie by default, but only if dawaf setup use advanced features
        data.response.normal.score = 3;
        detector.score+=3;
    }

    if (
        !utils.hasHeader('location',data.response.normal.headers) &&
        utils.hasHeader('location',data.response.commandInjection.headers)
    ) {
        // Common setup: redirect when attack detected
        detector.score+=1;
    }

    cb({
        name:detector.name,
        score:detector.score,
        scoreMax:detector.scoreMax,
        ratio:Math.round((detector.score*100)/detector.scoreMax)
    });
};

module.exports = detector;