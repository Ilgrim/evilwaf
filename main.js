var util = require('util');
var events = require('events').EventEmitter;
var options = require('./libs/options');

var dns = require('dns');
var async = require('async');


var evilwaf = function(opts) {
    if (false === (this instanceof evilwaf)) {
        return new evilwaf(opts);
    }
    var self = this;
    this.options = opts;
    events.call(self);
};

util.inherits(evilwaf, events);

evilwaf.prototype.run = function() {

    if (!this.options.urlParsed.protocol.match(/http/i)) {
        this.emit('error','passed arguments is not a valid URL');
        return;
    }
};


module.exports = evilwaf;
