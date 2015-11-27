var https = require('https');

var options = {
    hostname: '192.168.10.115',
    headers:{
        host:'my.bee-ware.netx'
    },
    rejectUnauthorized:false,
    port: 443,
    path: '/',
    method: 'GET'
};

var req = https.request(options, function(res) {
    console.log("statusCode: ", res.statusCode);
    console.log(res);

    console.log("headers: ", res.headers);

    res.on('data', function(d) {
        process.stdout.write(d);
    });
});
req.end();

req.on('error', function(e) {
    console.error(e);
});