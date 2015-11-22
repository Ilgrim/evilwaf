var expect = require('chai').expect;
var path = require('path');
var url = require('url');
var utils = require('../libs/utils');

suite(path.basename(__filename), function() {

    var urls = [
        {url:'http://www.test.com',isUrl:true},
        {url:'https://www.test.com',isUrl:true},
        {url:'http://www.test.com:8080',isUrl:true},
        {url:'https://www.test.com:8080',isUrl:true},
        {url:'http://127.0.0.1:1026/dawaf',isUrl:true},
        {url:'foo',isUrl:false},
        {url:'http://',isUrl:false}
    ];

    var text = '';

    urls.forEach(function(myUrl) {
        text = 'should be valid';
        if (!this.isURL) {
            text = 'should be invalid';
        }
        test(myUrl.url+' '+text,function() {
            expect(utils.isURL(url.parse(this.url))).to.be.equal(this.isUrl);
        }.bind(myUrl));
    });

});

