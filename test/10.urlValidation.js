var expect = require('chai').expect;
var path = require('path');
var url = require('url');
var utils = require('../libs/utils');

suite(path.basename(__filename), function() {

    var urls = [
        {url:'http://www.test.com',isUrl:true},
        {url:'foo',isUrl:false},
        {url:'http://',isUrl:false},
        {url:'http://',isUrl:false}
    ];


    urls.forEach(function(myUrl) {
        test(myUrl.url+' should be valid',function() {
            expect(utils.isURL(url.parse(this.url))).to.be.equal(this.isUrl);
        }.bind(myUrl));
    });

});

