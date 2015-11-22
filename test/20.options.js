var expect = require('chai').expect;
var path = require('path');
var http = require('http');
var evilwaf = require('../main');


suite(path.basename(__filename), function() {

    test('missing options should return an error', function (done) {
        new evilwaf(null,function(err) {
            expect(err).to.be.a('string');
            expect(err).to.match(/missing options/i);
            done();
        });
    });

    test('missing URL should return an error', function (done) {
        new evilwaf({},function(err) {
            expect(err).to.be.a('string');
            expect(err).to.match(/missing URL/i);
            done();
        });
    });

    test('invalid timeout should return an error', function (done) {
        new evilwaf({
            url:'http://www.test.com',
            timeout:'x'
        },function(err) {
            expect(err).to.be.a('string');
            expect(err).to.match(/timeout/i);
            done();
        });

    });

});
