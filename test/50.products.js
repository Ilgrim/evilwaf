var expect = require('chai').expect;
var path = require('path');
var http = require('http');
var request = require('request');
var evilwaf = require('../main');

var port = 1027;
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

            //console.log('testMode',req.headers['x-attack'],'host',req.headers['host'],'url',req.url);

            if (req.url === '/') {
                res.setHeader('server', headerServer);
                return res.end('ok');
            }

            if (req.url.match(/^\/denyall\/dawaf/)) {

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

                if (req.headers['x-attack']) {
                    //console.log(req.url,'attack detected','sending 403');
                    html = apacheForbidden.replace(/URL/g,req.url);
                    res.writeHead(403, {'Content-Type': 'text/html'});
                    return res.end(html);
                }

                res.writeHead(200, {'Content-Type': 'text/html'})
                return res.end('ok');
            }

            if (req.url.match(/^\/imperva\/incapsula/)) {

                if (!req.headers['host']) {
                    res.writeHead(503, 'Service Unavailable');
                    return res.end("<html style=\"height:100%\"><head><META NAME=\"ROBOTS\" CONTENT=\"NOINDEX, NOFOLLOW\"><meta name=\"format-detection\" content=\"telephone=no\"><meta name=\"viewport\" content=\"initial-scale=1.0\"><meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\"></head><body style=\"margin:0px;height:100%\"><iframe src=\"/_Incapsula_Resource?CWUDNSAI=5&xinfo=8-16409503-0 0NNN RT(1448190495137 1) q(0 -1 -1 -1) r(0 -1)&incident_id=0-154529083628126904&edet=9&cinfo=ffffffff\" frameborder=0 width=\"100%\" height=\"100%\" marginheight=\"0px\" marginwidth=\"0px\">Request unsuccessful. Incapsula incident ID: 0-154529083628126904</iframe></body></html>");
                }

                if (req.headers['host']!='localhost:'+port) {
                    res.writeHead(503, 'Service Unavailable');
                    return res.end("<html style=\"height:100%\"><head><META NAME=\"ROBOTS\" CONTENT=\"NOINDEX, NOFOLLOW\"><meta name=\"format-detection\" content=\"telephone=no\"><meta name=\"viewport\" content=\"initial-scale=1.0\"><meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\"></head><body style=\"margin:0px;height:100%\"><iframe src=\"/_Incapsula_Resource?CWUDNSAI=5&xinfo=8-16409503-0 0NNN RT(1448190495137 1) q(0 -1 -1 -1) r(0 -1)&incident_id=0-154529083628126904&edet=9&cinfo=ffffffff\" frameborder=0 width=\"100%\" height=\"100%\" marginheight=\"0px\" marginwidth=\"0px\">Request unsuccessful. Incapsula incident ID: 0-154529083628126904</iframe></body></html>");
                }

                res.setHeader('Set-Cookie','visid_incap_2439=K5h9ChE7SiCgnwOr7fp/RB6iUVYAAAAAQUIPAAAAAABvLZ8C5D/Fvmim+DKzYi1F; expires=Tue, 21 Nov 2017 09:11:32 GMT; path=/; Domain=.imperva.com');
                res.setHeader('Set-Cookie','incap_ses_287_2439=e1mBQ+0t4xy9XPTbXqH7Ax6iUVYAAAAANj5A4tyWSOyWt1ugTf/rXg==; path=/; Domain=.imperva.com');

                if (req.headers['x-attack']) {
                    res.writeHead(403, 'Forbidden');
                    return res.end("<html style=\"height:100%\"><head><META NAME=\"ROBOTS\" CONTENT=\"NOINDEX, NOFOLLOW\"><meta name=\"format-detection\" content=\"telephone=no\"><meta name=\"viewport\" content=\"initial-scale=1.0\"><meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\"></head><body style=\"margin:0px;height:100%\"><iframe src=\"/_Incapsula_Resource?CWUDNSAI=1&xinfo=8-16409570-0 0NNN RT(1448190496382 0) q(0 -1 -1 -1) r(0 -1) B15(3,1001,1)&incident_id=287000430057275853-154529650563809976&edet=15&cinfo=03000000\" frameborder=0 width=\"100%\" height=\"100%\" marginheight=\"0px\" marginwidth=\"0px\">Request unsuccessful. Incapsula incident ID: 287000430057275853-154529650563809976</iframe></body></html>");
                }

                res.setHeader('x-cdn','Incapsula');
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

    test('waf simulator must be up and running', function (done) {
        request(myUrl,function(err,response,body) {
            expect(response.statusCode).to.be.equal(200);
            expect(response.headers.server).to.be.equal(headerServer);
            expect(body).to.be.equal('ok');
            done();
        });
    });

    var testScore = function(err,data,re,done) {

        expect(err).to.be.null;
        expect(data).to.be.a('object');
        expect(data.scores).to.be.a('object');

        var score;
        var myScore;

        Object.keys(data.scores).forEach(function(waf) {
            myScore = parseInt(data.scores[waf].score);
            if (waf.match(re)) {
                expect(myScore).to.be.above(0);
                score = myScore;
            } else if (waf == 'WAF') {
                expect(myScore).to.be.equal(100);
            }
        });

        Object.keys(data.scores).forEach(function(waf) {
            if (!waf.match(re) && waf !='WAF') {
                expect(parseInt(data.scores[waf].score)).to.be.below(score);
            }
        });

        done();
    };

    test('waf simulator DenyAll/DAWAF (was Bee Ware/i-Suite) : should have a score > 0, other less', function (done) {
        new evilwaf({
            url:myUrl+'/denyall/dawaf',
            testMode:true
        },function(err,data) {
            testScore(err,data,/dawaf/i,done);
        });
    });

    test('waf simulator Imperva/Incapsula : should have a score > 0, other less', function (done) {
        new evilwaf({
            url:myUrl+'/imperva/incapsula',
            testMode:true
        },function(err,data) {
            testScore(err,data,/imperva/i,done);
        });
    });

    test('waf simulator must be stopped',function(done) {
        srv.close();
        done();
    });

});
