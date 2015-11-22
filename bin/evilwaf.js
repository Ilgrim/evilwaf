#!/usr/bin/env node
var evilwaf = require('../main');
var options = require('../libs/options');
var output = require('../libs/formater');

options.parse(process.argv,function(err,options) {

    new evilwaf(options,function(err,results) {
        if (err) {
            return output({error:err},options);
        }

        results.waf.forEach(function(waf) {
            console.log(results.url+'|',waf.name,waf.ratio+'%');
        })
    });

});




