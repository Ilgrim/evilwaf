var util = require('util');
var events = require('events').EventEmitter;
var utils = require('./libs/utils.js');
var url = require('url');
var fs = require('fs');
var dns = require('dns');
var async = require('async');
var request = require('request');

var evilwaf = function(opts,cb) {
    if (false === (this instanceof evilwaf)) {
        return new evilwaf(opts,cb);
    }
    var self = this;
    this.options = opts;
    this.callback = cb;
    this.result = {};
    this.requestOptions = {
        followRedirect:false,
        headers:{
            'user-agent':'evilwaf https://github.com/eviltik/evilwaf'
        }
    };
    this.detectors = [];

    var detectorsDir = __dirname+'/detectors';
    var detectors = fs.readdirSync(detectorsDir);
    detectors.forEach(function(detector) {
        self.detectors.push(require(detectorsDir+'/'+detector));
    });

    events.call(self);
    setTimeout(this.run.bind(this),1);
};

util.inherits(evilwaf, events);

evilwaf.prototype.checkOptions = function() {
    var err;

    if (!this.options) {
        err = 'missing options, at least {url:myUrl}';
    }

    if (!err && !this.options.url) {
        err = 'missing URL';
    }

    if (!err && this.options.timeout && typeof this.options.timeout != 'number') {
        err = 'timeout must be a number (millisecond)';
    }

    if (err) {
        this.callback && this.callback(err);
        return this.emit('error',err);
    }

    if (!this.options.timeout) this.options.timeout = 2000;

    if (this.options.silent) {
        delete this.requestOptions.headers['user-agent'];
    }

    if (!this.options.urlParsed) {
        this.options.urlParsed = url.parse(this.options.url);
        this.options.urlParsed.protocol = this.options.urlParsed.protocol || '';
    }

    if (!utils.isURL(this.options.urlParsed)) {
        this.emit('error','passed arguments is not a valid URL');
        return;
    }

    this.result.url = this.options.url;

    this.emit('ready');
};

evilwaf.prototype.formatResponse = function(response,body) {
    return {
        request: {
            headers: response.req._header
        },
        headers:response.headers,
        status:{
            code:response.statusCode,
            message:response.statusMessage
        },
        body:body
    }
};

evilwaf.prototype.setupTimeout = function(self,req,cb) {
    req.on('socket',function(socket) {
        socket.on('timeout',function() {
            cb('timeout '+self.options.timeout+' ms');
        });
        socket.on('connect',function() {
            socket.setTimeout(self.options.timeout);
        });
        socket.setTimeout(self.options.timeout);
    });
};

evilwaf.prototype.scan = function(cb) {
    var self = this;
    this.emit('start',this.options);
    async.series([
        function lookup(callback) {
            //console.log('lookup',self.options.urlParsed.hostname);
            dns.lookup(self.options.urlParsed.hostname,function(err,res) {
                //console.log('lookup callback');
                if (err) return cb(err);
                self.result.ip = res;
                self.result.response = {};
                callback();
            })
        },
        function requestNormal(callback) {
            //console.log('requestNormal',self.options.url);
            var r = request.get(self.options.url,self.requestOptions,function(err,response,body) {
                //console.log('requestNormal callback');
                if (err) return cb(err);
                self.result.response.normal = {
                    request:{
                        headers:response.req._header
                    },
                    headers:response.headers,
                    body:body
                };
                callback();
            });

            self.setupTimeout(self,r,cb);

        },
        function requestWithoutHostHeader(callback) {

            var r = request.get(self.options.url,self.requestOptions,function(err,response,body) {
                if (err) return cb(err);
                self.result.response.noHost = self.formatResponse(response,body);
                callback();
            });

            r.removeHeader('host');
            self.setupTimeout(self,r,cb);
        },
        function requestBadHost(callback) {

            var r = request.get(self.options.url,self.requestOptions,function(err,response,body) {
                if (err) return cb(err);
                self.result.response.badHost = self.formatResponse(response,body);
                callback();
            });

            r.setHeader('host','evilfqdn');
            self.setupTimeout(self,r,cb);
        },
        function requestCommandInjection(callback) {
            var urlTmp = JSON.parse(JSON.stringify(self.options.urlParsed));
            if (!urlTmp.search) {
                urlTmp.search = 'evilcommand=cmd.exe';
            } else {
                urlTmp.search+= '&evilcommand=cmd.exe';
            }
            urlTmp = url.format(urlTmp);
            var r = request.get(urlTmp,self.requestOptions,function(err,response,body) {
                if (err) return cb(err);
                self.result.response.commandInjection = self.formatResponse(response,body);
                callback();
            });
            self.setupTimeout(self,r,cb);
        },
        function analyseResult(callback) {
            self.result.waf = [];
            self.detectors.forEach(function(detector) {
                detector.analyze(self.result,function(data) {
                    self.result.waf.push(data);
                });
            });
            //console.log(JSON.stringify(self.result,null,4));
            cb(null,self.result);
        }
    ]);
};

evilwaf.prototype.run = function() {
    this.checkOptions();
    this.scan(function(err,data) {
        if (this.callback) {
            return this.callback(err,data);
        }
        this.emit('done');
    }.bind(this));

};


module.exports = evilwaf;
