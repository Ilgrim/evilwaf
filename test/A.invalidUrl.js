
var expect = require('chai').expect;
var path = require('path');
var evilwaf = require('../main');

suite(path.basename(__filename), function() {

    //var option = require('../libs/options');


    test('travis test',function() {
        expect('test').to.be.equal('test');
    });

});

