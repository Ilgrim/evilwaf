#!/usr/bin/env node
var evilwaf = require('../main');
var options = require('../libs/options');
var output = require('../libs/formater');

options.parse(process.argv,function(err,options) {

    var scan = new evilwaf(options);

    scan.on('result', function (data) {
        if (!options.json) {
            process.stderr.write('\r\033[0K');
        }
        output(data, options);
    });

    scan.on('error', function (err) {
        output({error:err},options);
    });

    scan.run();

});




