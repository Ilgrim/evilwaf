var utils = require('../libs/utils');
var Detector = require('../libs/Detector');
var detector = new Detector();

detector.setName('DenyAll/DAWAF');

detector.setInfo([
    'http://www.denyall.com/',
    'DAWAF is the new name of Bee Ware i-Suite since 2014',
    'Reverse Proxy is based on apache 2'
]);

detector.analyze = function(data,cb) {

    var response = data.result.response;

    // by default, apache send a 400 error when no host header
    this.incrementScore(utils.isApacheError(400,response.noHost),3,'noHost400');

    // by default, DAWAF send a 403 when attack detected
    this.incrementScore(utils.isApacheError(403,response.commandInjection),5,'attack403');

    // by default, DAWAF send a 403 when header host value does not match DAWAF setup
    this.incrementScore(utils.isApacheError(403,response.badHost),2,'badHost403');

    // cookies are used when waf configuration contains websso or advanced security features
    // administrator often forget to change waf cookie name
    this.incrementScore(utils.setCookieNameMatch(/BWFSESSID/,response.normal.headers),10,'cookieFound');

    // Common setup: redirect when attack detected
    var test = !utils.hasHeader('location',response.normal.headers) && utils.hasHeader('location',response.commandInjection.headers);
    this.incrementScore(test,3,'attack301or302');

    cb(null,this.getScore(data));
};

module.exports = detector;