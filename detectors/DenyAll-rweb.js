var utils = require('../libs/utils');
var Detector = require('../libs/Detector');
var detector = new Detector();

detector.setName('DenyAll/rWeb');

detector.setInfo([
    'http://www.denyall.com/',
    'rWeb is the first WAF in France, see mod_eaccess (patrick asty)',
    'Reverse Proxy is based on apache 1'
]);

detector.analyze = function(data,cb) {

    var response = data.result.response;

    // by default, apache send a 400 error when no host header
    this.incrementScore(utils.isApacheError(400,response.noHost),3,'noHost400');

    // by default, rWeb send a 301 when header host value does not match rWeb setup
    this.incrementScore(utils.isApacheError(301,response.badHost),2,'badHostRedirect301');

    // by default, rWeb send a 407 when attack detected
    this.incrementScore(utils.isApacheError(407,response.commandInjection),5,'attack407');

    if (!utils.isApacheError(407,response.commandInjection)) {
        // Common setup: redirect when attack detected    }
        var test = !!utils.hasHeader('location', response.normal.headers) && utils.hasHeader('location', response.commandInjection.headers);
        this.incrementScore(test, 3, 'attack301or302');
    }

    cb(null,this.getScore(data));
};

module.exports = detector;