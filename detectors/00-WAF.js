var diff = require('fast-diff');
var Detector = require('../libs/Detector');
var detector = new Detector();

// generic waf detection

detector.setName('WAF');

detector.setInfo([
    'generic waf detector'
]);

detector.analyze = function(data,cb) {

    // very basic logic :
    // if there is a waf in front of a web app, the response of
    // a request having an attack will be completely different
    // than the normal page (redirect or custom page)

    var responses = data.result.response;
    var htmlNormal = responses.normal.body;
    var htmlCommandInjection = responses.commandInjection.body;

    var diffs = diff(htmlNormal,htmlCommandInjection);

    this.incrementScore(diffs.length>3,1,'diffFoundOnAttack');

    cb(null,this.getScore(data));

};

module.exports = detector;