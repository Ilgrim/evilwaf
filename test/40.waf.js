var expect = require('chai').expect;
var path = require('path');
var http = require('http');
var request = require('request');
var evilwaf = require('../main');

var port = 1026;
var myUrl = 'http://localhost:'+port;
var headerServer = 'evilwaf webserver';
var apacheForbidden = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>403 Forbidden</title>\n</head><body>\n<h1>Forbidden</h1>\n<p>You don\'t have permission to access URL\non this server.</p>\n</body></html>\n';
var apacheBadRequest = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>400 Bad Request</title>\n</head><body>\n<h1>Bad Request</h1>\n<p>Your browser sent a request that this server could not understand.<br />\n</p>\n</body></html>\n';
suite(path.basename(__filename), function() {

    var srv;

    // Local fake server
    var server = function(cb) {
        return http.createServer(function (req, res) {
            var html='';

            if (req.url === '/') {
                res.setHeader('server', headerServer);
                return res.end('ok');
            }

            if (req.url.match(/^\/dawaf/)) {

                if (!req.headers['host']) {
                    //console.log(req.url,'no host header, sending 400');
                    res.writeHead(400, {'Content-Type': 'text/html'});
                    return res.end(apacheBadRequest);
                }

                if (req.headers['host']!='localhost:'+port) {
                    //console.log(req.url,'host header is not','localhost:'+port,'sending 403');
                    html = apacheForbidden.replace(/URL/g,req.url);
                    res.writeHead(403, {'Content-Type': 'text/html'});
                    return res.end(html);
                }

                if (req.url.match(/evil/)) {
                    //console.log(req.url,'attack detected','sending 403');
                    html = apacheForbidden.replace(/URL/g,req.url);
                    res.writeHead(403, {'Content-Type': 'text/html'});
                    return res.end(html);
                }

                //console.log(req.url);

                res.writeHead(200, {'Content-Type': 'text/html'});
                return res.end('ok');
            }

            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end('Not Found');

        }).listen(port,'127.0.0.1',cb);
    };

    before(function(done) {
        srv = server(function(err) {
            if (err) throw err;
            done();
        });
    });

    test('local webserver must be up and running', function (done) {
        request(myUrl,function(err,response,body) {
            expect(response.statusCode).to.be.equal(200);
            expect(response.headers.server).to.be.equal(headerServer);
            expect(body).to.be.equal('ok');
            done();
        });
    });

    test('DenyAll DAWAF (was Bee Ware i-Suite) should have a score > 50', function (done) {

        new evilwaf({
            url:myUrl+'/dawaf'
        },function(err,data) {
            if (err) throw err;
            expect(data).to.be.a('object');
            expect(data.ip).to.be.a('string');
            expect(data.waf).to.be.a('array');

            data.waf.forEach(function(waf) {
                if (waf.name.match(/dawaf/i)) {
                    expect(waf.ratio).to.be.above(50);
                }
            });
            done();
        });
    });


    test('local webserver must be stopped',function(done) {
        srv.close();
        done();
    });

});
