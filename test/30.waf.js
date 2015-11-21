var expect = require('chai').expect;
var path = require('path');
var http = require('http');
var port = 1026;

suite(path.basename(__filename), function() {

    // Local fake server
    var server = function(cb) {
        return http.createServer(function (req, res) {
            res.send('ok');
        }).listen(port,'127.0.0.1',cb);
    };

    var srv = server(function(err) {
        if (err) throw err;

        test('a', function (done) {
            expect('foo').to.be.equal('foo');
            setTimeout(done,1000);
        });

        test('b', function (done) {
            expect('bla').to.be.equal('bla');
            srv.close();
            setTimeout(done,1000);
        });

    });
});
