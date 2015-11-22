var expect = require('chai').expect;
var path = require('path');
var http = require('http');
var evilwaf = require('../main');


suite(path.basename(__filename), function() {

    test('wop3azremlksdfmlkdsf.com should return error ENOTFOUND', function (done) {
        new evilwaf({
            url:'http://wop3azremlksdfmlkdsf.com'
        },function(err,data) {
            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.be.a('string');
            expect(err.message).to.match(/ENOTFOUND/i);
            expect(data).to.be.a('undefined');
            done();
        });
    });

    test('closed port must return error ECONNREFUSED',function(done) {
        new evilwaf({
            url:'http://localhost:2121'
        },function(err,data) {
            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.be.a('string');
            expect(err.message).to.match(/ECONNREFUSED/i);
            expect(data).to.be.a('undefined');
            done();
        });
    })


});
