var utils = require('../libs/utils');

var detector = {};

detector.name = 'DenyAll/DAWAF';

// feel free to ad credits, note and changes !
detector.info = [
    'http://www.denyall.com/',
    'DAWAF is the new name of Bee Ware i-Suite since 2014',
    'Reverse Proxy is based on apache 2'
];

detector.analyze = function(data,cb) {

    var scoreMax = 15;

    var scores = data.scores[detector.name] = {
        noHost:0,
        badHost:0,
        commandInjection:0,
        normal:0,
        total:0
    };

    console.log(data);


    var response = data.result.response;

    if (utils.isApacheError(400,response.noHost)) {
        // by default, apache send a 400 error when no host header
        scores.noHost+=3;
        scores.total+=3;
    }

    if (utils.isApacheError(403,response.commandInjection)) {
        // by default, DAWAF send a 403 when attack detected
        scores.commandInjection+= 5;
        scores.total+=5;
    }

    if (utils.isApacheError(403,response.badHost)) {
        // by default, DAWAF send a 403 when header host value does not match DAWAF setup
        scores.badHost+=2;
        scores.total+=2;
    }

    if (utils.isApacheError(400,response.badHost)) {
        // @todo new default behavior ? have to double check
        scores.badHost+=1;
        scores.total+=1;
    }

    if (utils.setCookieNameMatch(/BWFSESSID/,response.normal.headers)) {
        // No cookie by default, but only if dawaf setup use advanced features
        scores.normal+=3;
        scores.total+=3;
    }

    if (
        !utils.hasHeader('location',response.normal.headers) &&
        utils.hasHeader('location',response.commandInjection.headers)
    ) {
        // Common setup: redirect when attack detected
        scores.commandInjection+=1;
        scores.total+=1;
    }

    scores.ratio = Math.round((scores.total*100)/scoreMax)+'%';

    cb();
};

module.exports = detector;