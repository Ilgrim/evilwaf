var request = new require('request');
var async = require('async');
var randomstring = require('randomstring');
var step = require('step');
var https = require('https');
var crypto = require('crypto');
var fs = require('fs');

// Allow self signed certificates for requests and proxied requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var opts = {
    //url:'https://192.168.10.115/',
    url:'https://127.0.0.1/',
    requestOptions:{
        followRedirect:false,
        headers:{
            'Cache-Control':'max-age=0',
            'Connection':'close'
        }
    }
};

var srv = {
    key: fs.readFileSync('/var/www/map.teoola.fr/dev/server/certs/teoola.key').toString(),
    cert: fs.readFileSync('/var/www/map.teoola.fr/dev/server/certs/teoola.crt').toString()
}

https.createServer(srv,function (req, res) {
    console.log(JSON.stringify(req.headers));

    if (!req.headers.host) {
        res.writeHead(400);
    } else {
        res.writeHead(403);
    }
    return res.end('ok');
}).listen(443,'127.0.0.1',function() {

    /*
    async.series([

        function (callback) {

            //return callback();

            request.get(opts.url, opts.requestOptions, function (err, response) {
                if (err) throw err;
                console.log('requestNoHost', response.statusCode);
                callback();
            }).removeHeader('host');
        },

        function (callback) {

            opts.requestOptions.headers.host = 'bla';

            request.get(opts.url, opts.requestOptions, function (err, response) {
                if (err) throw err;
                console.log('requestBadHost', response.statusCode);
                process.exit(0);
            });
        }
    ]);

    */
});
