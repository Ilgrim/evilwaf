var utils = require('../libs/utils');
var Detector = require('../libs/detector');
var detector = new Detector();

detector.setName('Imperva/Incapsula');

detector.setInfo([
    'http://www.imperva.com/'
]);

detector.analyze = function(data,cb) {

    var response = data.result.response;

    // based on http://www.imperva.com behavior, 2015/11

    this.incrementScore(utils.setCookieNameMatch(/visid_incap/,response.normal.headers),3,'cookieVisitorIdFound');

    this.incrementScore(utils.setCookieNameMatch(/incap_ses/,response.normal.headers),3,'cookieSessionFound');

    this.incrementScore(response.normal.headers['x-cdn'] == "Incapsula",3,'xCdnHeaderFound');

    var test = response.noHost.status.code == 503 && response.noHost.status.message == 'Service Unavailable';
    this.incrementScore(test,3,'noHost503');

    var test = response.badHost.status.code == 503 && response.badHost.status.message == 'Service Unavailable';
    this.incrementScore(test,3,'badHost503');

    if (response.commandInjection.body.match(/Incapsula/ig)) {
        this.incrementScore(test,3,'incapsulaFoundInAttackResponse');
    }

    cb(null,this.getScore());
};

module.exports = detector;