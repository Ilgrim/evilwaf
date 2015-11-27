var expect = require('chai').expect;
var path = require('path');
var http = require('http');
var request = require('request');
var evilwaf = require('../main');
var url = require('url');

var port = 1026;
var myUrl = 'http://localhost:'+port;

String.prototype.repeat = function(num) {
    return new Array( num + 1 ).join( this );
};

suite(path.basename(__filename), function() {

    var srv;

    // Local fake server
    var server = function(cb) {
        return http.createServer(function (req, res) {
            var html='';

            var uri = url.parse(req.url).pathname;

            //console.log(req.headers.host,req.path,req.url);

            res.writeHead(200, {'Content-Type': 'text/html'});

            if (uri === '/') {
                return res.end('ok');
            }

            if (!req.url.match(/cmd/)) {
                if (req.url === '/little') {
                    return res.end('little content');
                }

                if (req.url === '/medium') {
                    return res.end('medium content'.repeat(20));
                }

                if (req.url === '/big') {
                    return res.end('big content'.repeat(200));
                }

            } else {
                return res.end('default block page'.repeat(10));
            }


        }).listen(port,'127.0.0.1',cb);
    };

    before(function(done) {
        srv = server(function(err) {
            if (err) throw err;
            done();
        });
    });


    test('waf simulator must be up and running', function (done) {
        request(myUrl,function(err,response,body) {
            expect(response.statusCode).to.be.equal(200);
            expect(body).to.be.equal('ok');
            done();
        });
    });


    var shouldReturnNoWaf = function(err,data) {
        if (err) throw err;
        expect(data).to.be.a('object');
        expect(data.scores).to.be.a('object');
        expect(data.scores.WAF).to.be.a('object');
        expect(data.scores.WAF.score).to.be.equal(0);
        this();
    };

    var shouldReturnWaf = function(err,data) {
        if (err) throw err;
        expect(data).to.be.a('object');
        expect(data.scores).to.be.a('object');
        expect(data.scores.WAF).to.be.a('object');
        expect(data.scores.WAF.score).to.be.equal(100);
        this();
    };

    test('detector must return no waf', function (done) {
        new evilwaf({url:myUrl+'/'},shouldReturnNoWaf.bind(done));
    });

    test('detector must return waf (normal page having little content)', function (done) {
        new evilwaf({url:myUrl+'/little'},shouldReturnWaf.bind(done));
    });

    test('detector must return waf (normal page having medium content)', function (done) {
        new evilwaf({url:myUrl+'/medium'},shouldReturnWaf.bind(done));
    });

    test('detector must return waf (normal page having big content)', function (done) {
        new evilwaf({url:myUrl+'/big'},shouldReturnWaf.bind(done));
    });

    test('waf simulator must be stopped',function(done) {
        srv.close();
        done();
    });

});
