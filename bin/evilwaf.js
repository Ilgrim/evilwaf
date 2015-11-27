#!/usr/bin/env node
var evilwaf = require('../main');
var options = require('../libs/options');
var output = require('../libs/formater');

options.parse(process.argv,function(err,options) {

    new evilwaf(options,function(err,data) {
        if (err) {
            return output({error:err},options);
        }

        console.log(JSON.stringify(data,null,4));
    });

});

